/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class AR extends ToolCli
{
    constructor(ts, exefile)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile);
        if(!arg0) throw new Error("Can't resolve esp8266 AR executable");
        super(ts, "esp8266/ar", {
            Role:  ToolCli.Role.Archive,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, "cr ${DSTFILE} ${SRCFILES}"]
        });
    }
}

class ObjCopy extends ToolCli
{
    constructor(ts, exefile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw new Error("Can't resolve objcopp8266 executable");
        super(ts, "esp8266/objcopy", {
            Role: ToolCli.Role.Extract,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: rule === "elf->hex" ? "hex" : "eep",
            Invocation: rule === "elf->hex" ?
                [arg0, "-O ihex -R .eepprop ${SRCFILE} ${DSTFILE}"] :
                [arg0, "-O ihex -j .eeprom " +
                         "--set-section-flags=.eeprom=alloc,load " +
                         "--no-change-warnings --change-section-lma " +
                         ".eeprom=0 ${SRCFILE} ${DSTFILE}"],
        });
    }
}

class EspTool extends ToolCli
{
    constructor(ts, exefile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw new Error("Can't resolve objcopp8266 executable");
        super(ts, "esp8266/objcopy", {
            Role: ToolCli.Role.Extract,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: rule === "elf->hex" ? "hex" : "eep",
            Invocation: rule === "elf->hex" ?
                [arg0, "-O ihex -R .eepprop ${SRCFILE} ${DSTFILE}"] :
                [arg0, "-O ihex -j .eeprom " +
                         "--set-section-flags=.eeprom=alloc,load " +
                         "--no-change-warnings --change-section-lma " +
                         ".eeprom=0 ${SRCFILE} ${DSTFILE}"],
        });
    }
}

exports.AR = AR;
exports.ObjCopy = ObjCopy;
exports.EspTool = EspTool;
