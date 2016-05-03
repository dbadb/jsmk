var host = require('./host.js');
var user = require("./user.js");
var build = require('./build.js');
var policy = require("./policy.js");
var logger = require("./logger.js");
var util = require("./util.js");
var argmap = require("minimist")(process.argv.slice(2));

exports.NewJsmk = function() // ---- factory --------------------------
{
    return new Jsmk();
}

class Jsmk
{
    constructor()
    {
        this.m_host = host.NewHost();
        this.m_user = user.NewUser();
        this.m_logger = logger.NewLogger(this.m_user.LogDir);
        this.m_logger.Extend(this); // extends this to support logging methods
        this.m_Policy = policy.NewPolicy(this.m_host, this.m_user);
        this.m_build = undefined; // only valid during build interval
        this.path = {
            join : function() {
                return util.FixupPath(path.join.apply(null, arguments));
            }
        }
    }

    BeginSession()
    {
        this.TIMESTAMP('jsmk begin {');
        this.parseArgs(); // initializes policy... may throw
        this.DEBUG("Host:   " + JSON.stringify(this.m_host));
        this.DEBUG("User:   " + JSON.stringify(this.m_user));
        this.DEBUG("Policy: " + JSON.stringify(this.m_Policy));
    }

    EndSession(err)
    {
        this.TIMESTAMP('jsmk end } ' + (err ? "(FAILURE)" : "(SUCCESS)"));
    }

    // BeginBuild load/reload project hierarchy
    BeginBuild()
    {
        this.m_build = build.NewBuild(this.m_Policy);
    }

    EndBuild()
    {
        // TODO: cleanup
    }

    parseArgs()
    {
        if (argmap._ == "log")
        {
            this.m_logger.Query(); // prints to console
            throw("");
        }

        // validate args:
        //    - verify known stages if provided
        //    - obtain build policy if provided

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
                case 'n':
                    perform = false;
                    break;
                case 'b':
                    policy = argmap.b;
                    break;
                case 't':
                    threads = argmap.t;
                    break;
                case 'r':
                    rootdir = argmap.r;
                    break;
                default:
                    err = 1;
                    break;
            }
            if(err) break;
        }

        if(!err)
        {
            this.m_Policy.Init(rootdir, this.m_user.ConfigDir,
                                    policynm, stages,
                                    perform, threads);
            return;
        }

        var usage = `usage:

jsmk  [-b Policy (default: 'default')]
      [-r buildrootdir (default: '_inferred')]]
      [-t buildthreads (default: 0 (means use-all))]
      [-n]
      [buildstagelist | 'log' (default: '_deferToPolicy')]

            `; // end usage

        throw(usage);
    }
} // end of jsmk
