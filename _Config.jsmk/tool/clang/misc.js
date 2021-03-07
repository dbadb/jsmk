/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

// YACC converts .y to .c,.h files
class YACC extends ToolCli
{
    constructor(ts)
    {
        let exe = "bison";
        let exepath = jsmk.path.join(ts.BuildVars.MACOSX_BIN, exe);
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exe} ${ts.BuildVar.MACOSX_BIN}`);
        super(ts, "darwin/yacc", 
        {
            Role:  ToolCli.Role.Compile,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToMany,
            DstExt: "tab.c", // produce c and h file
            Invocation: [arg0, "-dv -b ${DSTFILENOEXT} ${SRCFILE}"],
            OutputNaming: "concise"
        });
    }
}

// LEX converts .lex to .yy.c files
class LEX extends ToolCli
{
    constructor(ts)
    {
        let exe = "flex";
        let exepath = jsmk.path.join(ts.BuildVars.MACOSX_BIN, exe);
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exe} ${ts.BuildVar.MACOSX_BIN}`);
        super(ts, "darwin/lex", {
            Role:  ToolCli.Role.Compile,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToMany,
            DstExt: "yy.c",
            Invocation: [arg0, "-o${DSTFILE} ${SRCFILE}"],
            OutputNaming: "concise"
        });
    }
}

class AR extends ToolCli
{
    constructor(ts)
    {
        let exe = "ar";
        let exepath = jsmk.path.join(ts.BuildVars.MACOSX_BIN, exe);
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exe} ${ts.BuildVar.MACOSX_BIN}`);
        super(ts, "darwin/ar", {
            Role:  ToolCli.Role.Archive,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, "cr ${DSTFILE} ${SRCFILES}"]
        });
    }
}

exports.AR = AR;
exports.YACC = YACC;
exports.LEX = LEX;
