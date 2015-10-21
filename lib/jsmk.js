var host = require('./host.js');
var user = require("./user.js");
var build = require('./build.js');
var policy = require("./policy.js");
var logger = require("./logger.js");
var argmap = require("minimist")(process.argv.slice(2));

exports.NewJsmk = function() // ---- factory --------------------------
{
    return new Jsmk();
}

function Jsmk() // ---- constructor  ----------------------------------
{
    this.m_host = host.NewHost();
    this.m_user = user.NewUser();
    this.m_logger = logger.NewLogger(this.m_user.LogDir);
    this.m_logger.extend(this); // extends this to support logging methods 
    this.m_buildPolicy = policy.NewBuildPolicy(this.m_host, this.m_user);
    this.m_build = undefined; // only valid during build interval
}

Jsmk.prototype = 
{
    BeginSession : function()
    {

        this.TIMESTAMP('jsmk begin {');

        this.parseArgs(); // may throw on error
        this.DEBUG("Host: "  + JSON.stringify(this.m_host));
        this.DEBUG("User: " + JSON.stringify(this.m_user));
    },

    EndSession : function(err)
    {
        this.TIMESTAMP('jsmk end } ' + (err ? "(FAILURE)" : "(SUCCESS)"));
    },

    // BeginBuild load/reload project hierarchy
    BeginBuild : function()
    {
        this.m_build = build.NewBuild(this.m_buildPolicy);
    },

    parseArgs : function() 
    {
        if (argmap._ == "errors" || argmap._ == 'lasterr')
        {
            options = 
            {
                from: new Date - 5*60*1000, // last 10 minutes
                until: new Date,
                limit: 10,
                start: 0,
                order: 'desc',
                fields: ['timestamp', 'level', 'message']
            };
            this.m_logger.query(options, function(err, results)
                {
                    console.log("recent log traffic:\n");
                    var errlist  = results.file;
                    for(i=0;i<errlist.length;i++)
                    {
                        var e = errlist[i];
                        if(e.level != 'TIMESTAMP')
                        {
                            console.log(e);
                        } 
                    }
                });
            throw("");
        }

        // validate args:
        //    - verify known stages if provided
        //    - obtain build policy if provided

        var err = 0;
        var policy = "default", perform = true, stages = undefined, threads=0;
        var rootdir = "_inferred";
        for(var i in argmap)
        {
            switch(i)
            {
                case '_': // the stagelist is expected here
                    stages = argmap._;
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
            this.m_buildPolicy.Init(this.m_user.ConfigDir, policy, stages, 
                                    perform, threads);
            return;
        }

        var usage = `usage: 

jsmk  [-b buildpolicy (default: 'default')]
      [-r buildrootdir (default: '_inferred')]]
      [-t buildthreads (default: 0 (means use-all))]
      [-n]
      [buildstagelist | 'errors' (default: '_deferToPolicy')]

            `; // end usage

        throw(usage); 
    },
} // end of jsmk  prototype

