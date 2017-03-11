var path = require("path");
var fs = require("fs");

// Policy is pure data.. policy files export a single var/map
// that includes values for our fields.
class Policy
{
    constructor(config)
    {
        this.RootDir = null;
        this.RootPath = null;
        this.StartDir = null;
        this.RootFile = "_Root.jsmk";
        this.ProjFile = "_Proj.jsmk";
        this.Perform = true;
        this.ThreadsRequested = 0;
        this.Threads = 0;
        this.AllStages = ["nuke",
                        "sync",
                        "clean",
                        "build",
                        "unittest",
                        "install",
                        "package",
                        "reposit",
                        "test",
                        "benchmark"];
        this.BuildStages = ["build", "install"];
        this.Deployment = "debug";
        this.DeploymentMap = {}; // usually from policy file.
        this.Flavor = "vanilla";
        this.BuildID = "head";
        this.BuildStrTmplt = "${OS}_${ARCH}_${TS}_${DEPLOY}_${FLAVOR}_${BUILDID}";
        this.BuiltDirTmplt = "${BRANCHDIR}/.built";
        this.InstallDirTmplt = "${ROOTDIR}/_install";
        this.PackageDirTmplt = "${ROOTDIR}/_package";
        this.ProjectMatch = null;
        this.ToolsetMatch = null;
        Object.assign(this, config);
    }

    Init()
    {
        if(!this.StartDir)
        {
            this.StartDir = jsmk.path.normalize(process.cwd());
        }

        if (!this.RootDir)
        {
            var dir = this.StartDir;
            var ldir = "";
            while(dir !== ldir)
            {
                var file = path.join(dir, this.RootFile);
                try
                {
                    fs.accessSync(file);
                    this.RootDir = jsmk.path.normalize(dir);
                    break;
                }

                catch(err)
                {
                    ldir = dir;
                    dir = path.dirname(ldir);
                }
            }
        }
        if(!this.RootDir)
        {
            throw("Can't locate: " + this.RootFile);
        }

        this.Threads = this.ThreadsRequested;
        if(this.Threads == 0)
        {
            this.Threads = jsmk.GetHost().Ncpus;
        }

        // final validation of rootdir
        this.RootPath = jsmk.path.join(this.RootDir, this.RootFile);
        fs.accessSync(this.RootPath);  // throws on error
    }

    GetThreads()
    {
        return this.Threads;
    }

    GetStages()
    {
        return this.BuildStages;
    }

    AcceptsToolset(ts)
    {
        if(ts && this.ToolsetMatch)
            return this.ToolsetMatch.test(ts.GetName());
        else
            return true;
    }

    AcceptsProject(dir)
    {
        if(this.ProjectMatch)
            return this.ProjectMatch.test(dir);
        else
            return true;
    }

    GetBuildStr(tsnm)
    {
        // for now we hard-code the template.. javascript's string templates
        // explicitly discourage passed-in string templates.
        if(!this.BuildStrMap[tsnm])
        {
            // win32_x64_vc12_debug_vanilla_head
            this.BuildStr[tsnm] = jsmk.Interpolate(this.BuildStrTmplt, smap);
        }
        return this.BuildStr[tsnm];
    }
}

exports.Policy = Policy;
