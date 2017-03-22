var ToolCli = jsmk.Require("tool_cli.js").Tool;

class vs12cc extends ToolCli
{
    constructor(toolset)
    {
        super(toolset, "vs12cc",
                {
                    Role: ToolCli.Role.Compile,
                    Semantics: ToolCli.Semantics.ManyToMany,
                    DstExt: "obj",
                    ActionStage: "build",
                    Invocation: "cl",
                    Syntax: {
                        define: "/D${KEY}=${VAL}",
                        include: "/I${VAL}",
                        flag: "${VAL}"
                    },
                });

    }
}

exports.Tool = vs12cc;
