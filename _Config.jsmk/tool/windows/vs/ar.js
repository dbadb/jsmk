let ToolCli = jsmk.Require("tool_cli.js").Tool;

class AR extends ToolCli
{
    constructor(ts, vsvers)
    {
        let exefile = "link";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.VSToolsDir);
        if(!arg0) throw new Error("Can't resolve link "+
                                    ts.BuildVars.VSToolsDir);
        super(ts, `vs${vsvers}/ar1`, {
            Role:  ToolCli.Role.Archive,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, "-lib -nologo -out:${DSTFILE} ${SRCFILES}"]
        });
    }
}

exports.AR = AR;
