/* global jsmk */
var host = require("./host.js");
var user = require("./user.js");
var build = require("./build.js");
var policy = require("./policy.js");
var logger = require("./logger.js");
var util = require("./util.js");
var argmap = require("minimist")(process.argv.slice(2));
var path = require("path");
var fs = require("fs");
let Promise = require("bluebird").Promise;

exports.NewJsmk = function() // ---- factory --------------------------
{
    return new Jsmk();
};

class Jsmk
{
    constructor()
    {
        this.m_build = undefined; // only valid during build interval
        this.path = util.PathFuncs;
        this.file = util.FileFuncs;
        this.colors = util.ColorFuncs;
        this.m_user = new user.User();
        this.m_logger = logger.NewLogger(this.m_user.LogDir);
        this.m_logger.Extend(this); // extends this to support logging methods
        this.m_host = new host.Host();
        util.UpdatePlatform(this.m_host.Platform, 
                            this.m_host.TargetPlatform);
        this.m_policy = null;
        this.m_toolsets = []; // loaded in BeginSession
        this.m_matchProjRoot = null;
        this.m_frameworks = {};
        this.m_performBuild = true;
    }

    Interpolate(str, val) // val can be map or callback function
    {
        return util.Interpolate(str, val);
    }

    GetConfigDirs()
    {
        return this.m_user.ConfigDirs;
    }

    GetHost()
    {
        return this.m_host;
    }

    GetPolicy()
    {
        return this.m_policy;
    }

    GetActiveToolset()
    {
        return global.Toolset;
    }

    GetTargetPlatform()
    {
        return global.Toolset.TargetPlatform;
    }

    GetTargetArch()
    {
        return global.Toolset.TargetArch;
    }

    GetTool(rule)
    {
        let result;
        if(this.m_build)
        {
            result = global.Toolset.GetTool(rule);
            if(!result)
                this.WARNING("Can't find a tool for " + rule);
        }
        else
        {
            this.WARNING("GetTool: invalid state");
        }
        return result;
    }

    BeginSession()
    {
        this.TIME("jsmk begin {");
        this.initPolicyFromArgs(); // initializes policy... may throw
        this.loadToolsets();
        this.DEBUG("Host:   " + JSON.stringify(this.m_host));
        this.DEBUG("User:   " + JSON.stringify(this.m_user));
        this.DEBUG("Policy: " + JSON.stringify(this.m_policy));
    }

    EndSession(err)
    {
        this.TIME("jsmk end } " + (err ? 
                this.colors.apply("red", "(FAILURE)") : 
                this.colors.apply("green", "(SUCCESS)")));
        this.m_toolsets = [];
    }

    // BeginBuild load/reload project hierarchy
    DoBuilds()
    {
        // we create a build for each requested toolset, since
        // toolsets differ in their view of a project hierarchy.
        let self = this;
        // Promise.each returns a single promise.
        return Promise.each(self.m_toolsets, (toolset)=>{
            if (self.m_policy.AcceptsToolset(toolset))
                return self.doBuild(toolset);
            else
                self.INFO("Policy skipping toolset " + toolset.GetHandle());
        });
    }

    // doBuilds is a re-entrant method invoked via the onDone method of BuildIt
    // after each stage is complete.
    doBuild(toolset)
    {
        let self = this;
        return new Promise( function(resolve, reject) {
            self.m_build = new build.Build(self.m_policy, toolset, 
                                            self.m_performBuild);
            global.Toolset = toolset;
            self.m_build.BuildIt()
                .then((toolset) => {
                    resolve(toolset);
                    global.Toolset = null;
                })
                .catch((err) => {
                    reject(err);
                    global.Toolset = null;
                });
        });  // this promise is monitored by DoBuilds
    }

    // Require is useful to "plugins" that wish to inherit
    // from built-in base classes.
    Require(nm)
    {
        return require("./" + nm);
    }

    GetFramework(name, vers)
    {
        let key = `${name}_${vers}`;
        if(!this.m_frameworks[key])
        {
            let FW = this.LoadConfig(`framework/${name}.js`).Framework;
            this.m_frameworks[key] = new FW(name, vers);
        }
        return this.m_frameworks[key];
    }

    LoadConfig(fileref)
    {
        for (let dir of this.GetConfigDirs())
        {
            let filepath = this.path.join(dir, fileref);
            try
            {
                fs.accessSync(filepath);
                try
                {
                    jsmk.DEBUG("loading config " + fileref);
                    let m = require(filepath);
                    return m;
                }
                catch(err)
                {
                    this.ERROR("Problem loading  " +
                            filepath +  " " + err.stack);
                }
            }
            catch (e)
            {
                if(e.code !== "ENOENT") {
                    this.ERROR(e);
                }
            }
        }
        this.ERROR("Can't find configfile: " + fileref);
        return null;
    }

    StackTrace()
    {
        var st = new Error();
        return st.stack;
    }

    initPolicyFromArgs()
    {
        if (argmap._ == "log")
        {
            this.m_logger.Query(); // prints to console
            throw new Error("exiting");
        }

        // validate args:
        //    - verify known stages if provided
        //    - obtain build policy if provided

        var usage = `usage:

jsmk  [-b Policy (default: 'default')]
      [-r buildrootdir (default: '_inferred')]]
      [-t buildthreads (default: 0 (means use-all))]
      [-d (means debug-logging)]
      [-d2 (means trace-logging)]
      [-l level]
      [-n (means don't perform actions)]
      [buildstagelist | 'log' (default: '_deferToPolicy')]

            `; // end usage
        let err = 0;
        let policynm = "default";
        let config = {};
        let loglevel = "INFO";
        for(let key in argmap)
        {
            switch(key)
            {
            case "_": // the stagelist is expected here
                if (argmap._.length > 0)
                {
                    config.BuildStages = argmap._;
                }
                break;
            case "n": // -n means don't perform actions
                this.m_performBuild = false;
                break;
            case "b": // -b build-policy
                policynm = argmap.b;
                break;
            case "t": // -t threadcount
                config.ThreadsRequested = argmap.t;
                break;
            case "d":
                if (argmap.d === 2)
                    loglevel = "TRACE";
                else
                    loglevel = "DEBUG";
                break;
            case "l":
                loglevel = argmap.l;
                break;
            case "r": // -r rootdir
                config.RootDir = argmap.r;
                break;
            default:
                err = 1;
                break;
            }
            if(err) break;
        }
        if(loglevel === "DEBUG" || loglevel === "TRACE")
        {
            this.m_logger.SetLevel(loglevel, null);
        }
        else
            this.m_logger.SetLevel(loglevel, this.msgFilter.bind(this));

        if(err)
            throw new Error(usage);
        else
        {
            let Policy = this.LoadConfig(`policy/${policynm}.js`).Policy;
            this.m_policy = new Policy(config);
            this.m_policy.Init();
        }
    }

    LogSubProcess(invoc, shorthand)
    {
        if(this.m_logger.GetLevel() !== "DEBUG" && 
           this.m_logger.GetLevel() !== "TRACE" )
        {
            if(shorthand)
                this.NOTICE(shorthand); // this is where we emit abstract command 
            else
            {
                let istr = this.path.basenameNoExt(invoc[0]) + " ";
                istr += this.msgFilter(invoc.slice(1).join(" "));
                if(istr.length > this.m_policy.MsgLengthLimit)
                    istr = istr.slice(0, this.m_policy.MsgLengthLimit) + "....";
                this.NOTICE(istr); // this is where we emit the shortened command
            }

        }
        else
        {
            let istr = invoc.join(" ");
            this.NOTICE(istr); // this is where we emit a full command
        }
    }

    escapeRegEx(str)
    {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    msgFilter(msg)
    {
        if(this.m_build)
        {
            if(!this.m_projRootFilter)
            {
                let pt = this.m_build.GetProjTree();
                if(pt)
                {
                    let ex = this.escapeRegEx(pt.ProjectDir + "/");
                    this.m_projRootFilter = new RegExp(ex, "g");
                }
            }
            if(this.m_projRootFilter)
                return msg.replace(this.m_projRootFilter, "ROOT/");
        }
        else
            this.m_projRootFilter = null;
        return msg;
    }

    loadToolsets()
    {
        // toolsets presumed located below:
        // dir/toolset and follow a prescribed naming convention
        // as well as order of precedence:
        //  1. hostname
        //  2. platform_arch
        //  3. platform
        let names = [this.m_host.Name,
                     this.m_host.Platform+"_"+this.m_host.TargetPlatform,
                     this.m_host.Platform+"_"+this.m_host.Arch,
                     this.m_host.Platform];
        let tspath = undefined;
        let foundpath = false;
        for (let nm of names)
        {
            for (let dir of this.GetConfigDirs())
            {
                tspath = this.path.join(dir, "tschooser", nm + ".js");
                try
                {
                    fs.accessSync(tspath);
                    foundpath = true;
                    break;
                }
                catch (e)
                {
                    tspath = undefined;
                }
            }
            if(foundpath)
                break;
        }

        if(foundpath)
        {
            jsmk.DEBUG("Toolset chooser: " + tspath);
            try
            {
                let ts = require(tspath);
                this.m_toolsets = ts.GetToolsets();
                jsmk.INFO(`Loaded ${this.m_toolsets.length} toolsets`);
            }
            catch (e)
            {
                jsmk.ERROR("toolset load failure " + e.stack ? e.stack : e);
            }
        }
        else {
            throw new Error("Couldn't find any toolsets for " + this.m_host.Name +
                    " (" + names + ")");
        }
    }
} // end of jsmk
