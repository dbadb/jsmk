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
            BuildStrTmplt: "${OS}_${ARCH}_${TOOLSET}_${DEPLOY}_${FLAVOR}_${BUILDID}",
            BuiltDirTmplt: "${BRANCHDIR}/.built",
            InstallDirTmplt: "${ROOTDIR}/.install",
            PackageDirTmplt: "${ROOTDIR}/.package"
        }
        super(config);
    }
}

exports.Policy = DefaultPolicy;
