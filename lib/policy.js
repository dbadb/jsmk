var path = require("path");
var fs = require("fs");
var util = require("./util.js");

var s_standardStages = {
            nuke: 0,
            sync: 1,
            clean: 2,
            build: 3,
            unittest: 4,
            install: 5,
            "package": 6,
            reposit: 7,
            test: 8,
            benchmark: 9
                    };

exports.NewPolicy = function(host, user)
{
    return new Policy(host, user);
}

class Policy
{
    constructor(host, user)
    {
        this.RootFile = "_Root.jsmk";
        this.RootPath = undefined;
        this.StartDir = util.FixupPath(process.cwd());
        this.Perform = true;
        this.Threads = 0;
        this.Stages = ["build", "install"];
        this.Deployment = "debug";
        this.DeploymentMap = {}; // usually from policy file.
        this.Flavor = "vanilla";
        this.BuildID = "head";
        this.BuildStrMap = {}; // keyed by toolset name
        this.BuildStrTmplt = "${OS}_${ARCH}_${TS}_${DEPLOY}_${FLAVOR}_${BUILDID}";
        this.BuiltDirTmplt = "${BRANCHDIR}/.built";
        this.InstallDirTmplt = "${ROOTDIR}/_install";
        this.PackageDirTmplt = "${ROOTDIR}/_package";
        this.ProjectMatch = "*";
        this.ToolsetMatch = "*";
    }

    Init(rootdir, configdir, policy, stages, perform, threads)
    {
        this.loadPolicy(configdir, policy); // should occur first (may throw)

        if(stages && stages.length > 0)
            this.setStages(stages);

        if (rootdir == "_inferred")
        {
            var dir = this.StartDir;
            var ldir = "";
            while(dir !== ldir)
            {
                var file = path.join(dir, this.RootFile);
                try
                {
                    fs.accessSync(file);
                    rootdir = dir;
                    break;
                }

                catch(err)
                {
                    ldir = dir;
                    dir = path.dirname(ldir);
                }
            }
        }
        // final validation of rootdir
        this.RootPath = util.FixupPath(path.join(rootdir, this.RootFile));
        fs.accessSync(this.RootPath);  // throws on error
        this.Perform = perform;
        this.Threads  = threads;
    }

    GetBuildStr(toolsetnm)
    {
        // for now we hard-code the template.. javascript's string templates
        // explicitly discourage passed-in string templates.
        if(!this.BuildStrMap[toolsetnm])
        {
            // win32_x64_vc12_debug_vanilla_head
            this.BuildStr[toolsetnm] = util.Interpolate(this.BuildStrTmplt,
                                                        smap);
        }
        return this.BuildStr[toolsetnm];
    }

    setStages(stagestr)
    {
        var inlist = stagestr.split(',');
        var slist = inlist.sort(function(a, b) {
                        var apri = s_standardStages[a];
                        var bpri = s_standardStages[b];
                        if (apri === undefined  || bpri === undefined) {
                            throw("invalid stage in stagelist: " +
                                    (apri ? b : a));
                        } else {
                            return (apri < bpri) ? -1 : 1;
                        }
                    });
        this.Stages = slist;
    }

    loadPolicy(dir, nm)
    {
        // policy files are expected  in "dir/policy/nm.js"
        var file = util.FixupPath(path.join(dir, "policy", nm + ".js"));
        var policy = require(file).Policy;
        for(var i in policy)
        {
            if (this.hasOwnProperty(i))
                this.i = policy.i;
            else
                jsmk.WARNING(nm + " policy has unknown field: " + i);
        }
    }
}
