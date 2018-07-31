/* global jsmk */
var Policy = jsmk.Require("policy.js").Policy;

class DefaultPolicy extends Policy
{
    constructor(optConfig)
    {
        let config =
        {
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
            Flavor:  jsmk.GetHost().Platform,
            BuildID: "head",
            ProjectMatch: null,
            ToolsetMatch: null,
            SubsetMatch: null,
            Package: "UnnamedPackage",
            ToolsetNameTmplt: "${ToolsetName}-${TargetArch}-${TargetPlatform}",
            BuildTargetTmplt: "${Toolset}-${Flavor}-${Deployment}",
            BuiltDirTmplt: "${DomainDir}/.built/${Module}", // add BuildID
            InstallDirTmplt: "${RootDir}/.install/${BuildTarget}/${Package}",
            PackageDirTmplt: "${RootDir}/.package/${BuildTarget}/${Package}",
        };
        Object.assign(config, optConfig);
        super(config);
    }
}

exports.Policy = DefaultPolicy;
