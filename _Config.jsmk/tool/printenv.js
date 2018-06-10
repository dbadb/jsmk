/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class Printenv extends ToolCli
{
    constructor(ts)
    {
        let arg0 = "/usr/bin/printenv";
        let plistStr = "";
        let config =
        {
            Role: ToolCli.Role.Test,
            Semantics: ToolCli.Semantics.NoneToNone,
            DstExt: "",
            ActionStage: "test",
            Invocation: [arg0],
        };
        super(ts, "printenv", config);
    }

    outputIsDirty(output, inputs, cwd)
    {
        return true;
    }
}

exports.Printenv = Printenv;
