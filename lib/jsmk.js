var host = require('./host.js');
var user = require("./user.js");
var build = require('./build.js');
var policy = require("./policy.js");
var logger = require("./logger.js");
var util = require("./util.js");
var argmap = require("minimist")(process.argv.slice(2));
var path = require("path");

exports.NewJsmk = function() // ---- factory --------------------------
{
    return new Jsmk();
}

class Jsmk
{
    constructor()
    {
        this.m_build = undefined; // only valid during build interval
        this.path = {
            join : function() {
                return util.FixupPath(path.join.apply(null, arguments));
            }
        }
        this.m_user = user.NewUser();
        this.m_logger = logger.NewLogger(this.m_user.LogDir);
        this.m_logger.Extend(this); // extends this to support logging methods
        this.m_host = host.NewHost(this);
        this.m_policy = policy.NewPolicy(this.m_host, this.m_user);
        this.m_toolsets = []; // loaded in BeginSession
    }

    GetConfigDirs()
    {
        return this.m_user.ConfigDirs;
    }

    BeginSession()
    {
        this.TIMESTAMP('jsmk begin {');
        this.initPolicyFromArgs(); // initializes policy... may throw
        this.loadToolsets();
        this.INFO("Host:   " + JSON.stringify(this.m_host));
        this.INFO("User:   " + JSON.stringify(this.m_user));
        this.INFO("Policy: " + JSON.stringify(this.m_policy));
    }

    EndSession(err)
    {
        this.TIMESTAMP('jsmk end } ' + (err ? "(FAILURE)" : "(SUCCESS)"));
    }

    // BeginBuild load/reload project hierarchy
    DoBuilds()
    {
        for (let ts of this.m_toolsets)
        {
            if (this.m_policy.AcceptsToolset(ts))
            {
                this.m_build = build.NewBuild(this, ts, this.m_policy);
                this.m_build.BuildIt();
            }
            else
            {
                this.INFO("Skipping toolset " + ts.GetName())
            }
        }
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
        var perform = true;
        var stages = undefined;
        var threads=0;
        var rootdir = "_inferred";
        for(var i in argmap)
        {
            switch(i)
            {
                case '_': // the stagelist is expected here
                    if (argmap._.length == 1)
                        stages = argmap._[0];
                    else
                        stages = argmap._.join(',');
                    break;
                case 'n': // -n means don't perform actions
                    perform = false;
                    break;
                case 'b': // -b build-policy
                    policy = argmap.b;
                    break;
                case 't': // -t threadcount
                    threads = argmap.t;
                    break;
                case 'r': // -r rootdir
                    rootdir = argmap.r;
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
            this.m_policy.Init(rootdir, this.GetConfigDirs(),
                                    policynm, stages,
                                    perform, threads);
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
                     this.Platform+"_"+this.Arch,
                     this.Platform];
        let tspath = undefined;
        let foundpath = false;
        for (let nm of names)
        {
            for (let dir of this.GetConfigDirs())
            {
                tspath = this.path.join(dir, "toolset", nm + ".js");
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

        if(foundpath) {
            self.m_toolsets = require(tspath).GetToolsets();
        }
        else {
            throw("Couldn't find any toolsets for " + this.m_host.Name);
        }
    }
} // end of jsmk
