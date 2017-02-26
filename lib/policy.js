var path = require("path");
var fs = require("fs");
var util = require("./util.js");

// Policy is pure data.. policy files export a single var/map
// that includes values for our fields.
class Policy
{
    constructor(config)
    {
        this.RootDir = null;
        this.RootFile = "_Root.jsmk";
        this.StartDir = null;
        this.Perform = true;
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
        this.ProjectMatch = "*";
        this.ToolsetMatch = "*";
        Object.assign(this, config);

        this.m_buildStrMap = {}; // keyed by toolset name
        this.m_rootPath = null;
    }

    Init()
    {
        if(!this.StartDir)
        {
            this.StartDir = util.FixupPath(process.cwd());
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
                    this.RootDir = dir;
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

        this.m_threads = this.Threads;
        if(this.m_threads == 0)
        {
            this.m_threads = jsmk.GetHost().Ncpus;
        }

        // final validation of rootdir
        this.m_rootPath = util.FixupPath(path.join(this.RootDir, this.RootFile));
        fs.accessSync(this.m_rootPath);  // throws on error
    }

    GetThreads()
    {
        return this.m_threads;
    }

    AcceptsToolset(ts)
    {
        return true; // TODO: apply ToolsetMatch
    }

    AcceptsProject(dir)
    {
        return true; // TODO: apply ProjectMatch
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
}

exports.Policy = Policy;
