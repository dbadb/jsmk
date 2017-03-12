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
        this.BuildTargetTmplt = "${HostPlatform}-${Toolset}-${Deployment}-${Flavor}";
        this.BuiltDirTmplt = "${DomainDir}/_built/${BuildTarget}/${Module}/";
        this.InstallDirTmplt = "${RootDir}/_install/${BuildTarget}/";
        this.PackageDirTmplt = "${RootDir}/_package/${BuildTarget}/";
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

    ConfigureProjSettings(proj)
    {
        if(proj.IsRoot())
        {
            // Setup Host BuildVars
            let config = {};
            let h = jsmk.GetHost();
            for(let f of Object.keys(h))
                config["Host" + f] = h[f];

            config.Toolset = jsmk.GetActiveToolset().GetName();

            for(let f of ["RootDir", "StartDir",
                          "Deployment", "Flavor", "BuildID",
                          "BuildTargetTmplt",
                          "BuiltDirTmplt",
                          "InstallDirTmplt",
                          "PackageDirTmplt"])
            {
                config[f] = this[f];
            }
            proj.MergeBuildVars(config);
        }

        if(proj.IsDomainController())
        {
            // Setup Domain BuildVars,
            proj.MergeBuildVars({
                DomainDir: proj.ProjectDir,
            });

            // Flatten Build Templates
            let config =
            {
                BuildTarget: proj.EvaluateBuildVar("BuildTargetTmplt"),
                BuiltDir: proj.EvaluateBuildVar("BuiltDirTmplt"),
                InstallDir: proj.EvaluateBuildVar("InstallDirTmplt"),
                PackageDir: proj.EvaluateBuildVar("PackageDirTmplt"),
            };
            proj.MergeBuildVars(config);
            // console.log("Policy BuiltDir:", config.BuiltDir);
            // Module is unknown at this point.
        }

        proj.MergeBuildVars({
                    ProjDir: proj.ProjectDir
                });
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
