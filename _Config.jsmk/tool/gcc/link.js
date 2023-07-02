/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class Link extends ToolCli
{
    constructor(ts, buildso=false)
    {
        let exefile = "g++";
        let arg0 = jsmk.path.resolveExeFile(exefile, 
                                ts.BuildVars.LINUX_TOOLCHAIN);
        super(ts, "linux/link",
            {
                Role: ToolCli.Role.Link,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: buildso ? "so" : "",
                ActionStage: "build",
                Invocation: [arg0, 
                    "-o ${DSTFILE} ${SRCFILES} ${FLAGS} ${LIBS}"],
                Syntax:
                {
                    Flag: "${VAL}",
                    Lib: "${VAL}"
                },
            }
        );
        if(buildso)
            this.AddFlags(this.GetRole(), ["-shared"]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }
}  // end of link

exports.Link = Link;
