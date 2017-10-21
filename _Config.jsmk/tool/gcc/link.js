/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class Link extends ToolCli
{
    constructor(ts)
    {
        let exefile = "g++";
        let arg0 = jsmk.path.resolveExeFile(exefile, 
                                ts.BuildVars.LINUX_TOOLCHAIN);
        super(ts, "linux/link",
            {
                Role: ToolCli.Role.Link,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: "",
                ActionStage: "build",
                Invocation: [arg0, 
                    "-o ${DSTFILE} ${SRCFILES} ${FLAGS} ${LIBS}"],
                Syntax:
                {
                    Flag: "${VAL}",
                    Lib: "-l${VAL}"
                },
            }
        );
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }
}  // end of link

exports.Link = Link;
