var cli = jsmk.Require("tool_cli.js").Tool;

class vs12cc extends cli
{
    constructor(toolset)
    {
        super(toolset, "vs12cc",
                {
                    Role: "compiler/c",
                    Semantics: cli.Semantics.ManyToMany,
                    DstExt: "obj",
                    ActionStage: "build",
                });

    }
}

exports.Tool = vs12cc;
