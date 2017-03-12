var Policy = jsmk.Require("policy.js").Policy;

class DefaultPolicy extends Policy
{
    constructor()
    {
        let config = {
            RootFile: "_Root.jsmk",
            ProjFile: "_Proj.jsmk",
            AllStages: ["nuke",
                        "sync",
                        "clean",
                        "build",
                        "unittest",
                        "install",
                        "package",
                        "reposit",
                        "test",
                        "benchmark"],
            BuildStages: ["build", "install"],
            Deployment: "debug",
            Flavor:  "vanilla",
            BuildID: "head",
            ProjectMatch: null,
            ToolsetMatch: null,
            SubsetMatch: null,
            BuildTargetTmplt: "${HostPlatform}-${Toolset}-${Flavor}-${Deployment}",
            BuiltDirTmplt: "${DomainDir}/_built/${Module}", // add BuildID
            InstallDirTmplt: "${RootDir}/_install",
            PackageDirTmplt: "${RootDir}/_package"
        }
        super(config);
    }
}

exports.Policy = DefaultPolicy;
