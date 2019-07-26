/* global jsmk */

let ToolCli = jsmk.Require("tool_cli.js").Tool;
let Arch = jsmk.Require("toolset.js").Arch;

class AR extends ToolCli
{
    constructor(ts, vsvers)
    {
        let exefile = "lib";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.VSToolsDir);
        if(!arg0) throw new Error("Can't resolve Lib "+ ts.BuildVars.VSToolsDir);
        super(ts, `vs${vsvers}/archive`, {
            Role:  ToolCli.Role.Archive,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, "-out:${DSTFILE} ${FLAGS} ${SRCFILES}"],
            Syntax: {
                Flag: "${VAL}"
            }
        });

        let machine;
        switch(ts.TargetArch)
        {
        case Arch.x86_32:
            machine="/machine:X86";
            break;
        case Arch.x86_64:
            machine="/machine:X64";
            break;
        case Arch.arm_32:
            machine="/machine:ARM";
            break;
        case Arch.arm_64:
            machine="/machine:ARM64";
            break;
        default:
            throw new Error("Lib: unknown arch " + ts.TargetArch);
        }

        this.AddFlags(this.GetRole(), [
            "-nologo",
            machine
        ]);
    }
}

exports.AR = AR;
