/* global jsmk */

let ToolCli = jsmk.Require("tool_cli.js").Tool;
let Arch = jsmk.Require("toolset.js").Arch;

// IBTOOL produces .nib "files" (directories to be copied into install location)
class IBTOOL extends ToolCli
{
    constructor(ts, vsvers)
    {
        let exepath = "/usr/bin/ibtool"; // doesn't appear to be toolchain versioned.
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exepath}`);
        super(ts, "darwin/ibtool", 
        {
            Role:  ToolCli.Role.Compile,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "nib", // xib -> nib
            Invocation: [arg0, "--compile ${DSTFILE} ${SRCFILE}"],
            OutputNaming: "concise"
        });

        this.AddFlags(this.GetRole(), [
            ["--output-format", "binary1"]
        ]);
    }
}

exports.IBTOOL = IBTOOL;
