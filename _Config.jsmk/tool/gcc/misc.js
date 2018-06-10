/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class AR extends ToolCli
{
    constructor(ts)
    {
        let exefile = "ar";
        let arg0 = jsmk.path.resolveExeFile(exefile, 
                                            ts.BuildVars.LINUX_TOOLCHAIN);
        if(!arg0) throw new Error("Can't resolve linux AR executable");
        super(ts, "linux/ar", {
            Role:  ToolCli.Role.Archive,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, "cr ${DSTFILE} ${SRCFILES}"]
        });
    }
}


exports.AR = AR;
