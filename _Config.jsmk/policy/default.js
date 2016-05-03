exports.Policy = {
    Stages: ["build", "install"],
    Deployment: "debug",
    Flavor:  "vanilla",
    BuildID: "head",
    ProjectMatch: "*",
    ToolsetMatch: "*",
    BuildStrTmplt: "${OS}_${ARCH}_${TOOLSET}_${DEPLOY}_${FLAVOR}_${BUILDID}",
    BuiltDirTmplt: "${BRANCHDIR}/.built",
    InstallDirTmplt: "${ROOTDIR}/.install",
    PackageDirTmplt: "${ROOTDIR}/.package"
};
