var host = require('./host.js');
var user = require("./user.js");
var build = require('./build.js');
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
}

class Jsmk
{
    constructor()
    {
        this.m_build = undefined; // only valid during build interval
        this.path = util.PathFuncs;
        this.file = util.FileFuncs;
        this.m_user = new user.User();
        this.m_logger = logger.NewLogger(this.m_user.LogDir);
        this.m_logger.Extend(this); // extends this to support logging methods
        this.m_host = new host.Host();
        this.m_policy = new policy.Policy(this.m_host, this.m_user);
        this.m_toolsets = []; // loaded in BeginSession
        this.m_activeToolset = null;
    }

    Interpolate(str, map)
    {
        return util.Interpolate(str, map);
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
        return ths.m_policy;
    }

    GetActiveToolset()
    {
        return this.m_activeToolset;
    }

    GetTool(rule)
    {
        let result;
        if(this.m_build)
        {
            result = this.m_build.GetToolset().GetTool(rule);
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
        this.TIMESTAMP('jsmk begin {');
        this.initPolicyFromArgs(); // initializes policy... may throw
        this.loadToolsets();
        this.DEBUG("Host:   " + JSON.stringify(this.m_host));
        this.DEBUG("User:   " + JSON.stringify(this.m_user));
        this.DEBUG("Policy: " + JSON.stringify(this.m_policy));
    }

    EndSession(err)
    {
        this.TIMESTAMP('jsmk end } ' + (err ? "(FAILURE)" : "(SUCCESS)"));
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
                {
                    return self.doBuild(toolset);
                }
                else
                {
                    self.INFO("Skipping toolset " + toolset.GetName())
                    return null;
                }
            });
    }

    // doBuilds is a re-entrant method invoked via the onDone method of BuildIt
    // after each stage is complete.
    doBuild(toolset)
    {
        let self = this;
        return new Promise( function(resolve) {
            self.m_activeToolset = toolset;
            self.m_build = new build.Build(self.m_policy, toolset);
            self.m_build.BuildIt().then( (toolset) => { resolve(toolset);} );
            self.m_activeToolset = null;;
        });
    }

    // Require is useful to 'plugins' that wish to inherit
    // from built-in base classes.
    Require(nm)
    {
        return require("./" + nm);
    }

    LoadConfig(fileref)
    {
        for (let dir of this.GetConfigDirs())
        {
            let filepath = this.path.join(dir, fileref);
            try
            {
                fs.accessSync(filepath);
                return require(filepath);
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

    initPolicyFromArgs()
    {
        if (argmap._ == "log")
        {
            this.m_logger.Query(); // prints to console
            throw("");
        }

        // validate args:
        //    - verify known stages if provided
        //    - obtain build policy if provided

        var usage = `usage:

jsmk  [-b Policy (default: 'default')]
      [-r buildrootdir (default: '_inferred')]]
      [-t buildthreads (default: 0 (means use-all))]
      [-n]
      [buildstagelist | 'log' (default: '_deferToPolicy')]

            `; // end usage
        var err = 0;
        var policynm = "default";
        var config = {};
        for(var i in argmap)
        {
            switch(i)
            {
                case '_': // the stagelist is expected here
                    if (argmap._.length > 0)
                        config.BuildStages = argmap._;
                    break;
                case 'n': // -n means don't perform actions
                    config.Perform = false;
                    break;
                case 'b': // -b build-policy
                    policynm = argmap.b;
                    break;
                case 't': // -t threadcount
                    config.Threads = argmap.t;
                    break;
                case 'r': // -r rootdir
                    config.RootDir = argmap.r;
                    break;
                default:
                    err = 1;
                    break;
            }
            if(err) break;
        }

        if(err)
            throw(usage);
        else
        {
            let Policy = this.LoadConfig(`policy/${policynm}.js`).Policy;
            this.m_policy = new Policy(config);
            this.m_policy.Init();
        }
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
            this.m_toolsets = require(tspath).GetToolsets();
            jsmk.INFO(`Loaded ${this.m_toolsets.length} toolsets`);
        }
        else {
            throw("Couldn't find any toolsets for " + this.m_host.Name +
                    " (" + names + ")");
        }
    }
} // end of jsmk
