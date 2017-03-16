let ToolCli = jsmk.Require("tool_cli.js").Tool;

class AR extends ToolCli
{
    constructor(ts)
    {
        let exefile = "arm-none-eabi-ar";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw("Can't resolve teensy AR executable");
        super(ts, "teensy/ar", {
            Role:  "archiver/c",
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, "cr ${DSTFILE} ${SRCFILES}"]
        });
    }
}

class ObjCopy extends ToolCli
{
    constructor(ts, rule)
    {
        let exefile = "arm-none-eabi-objcopy";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw("Can't resolve teensy objcopy executable");
        super(ts, "teensy/objcopy", {
            Role: "objcopy/elf",
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: rule === "elf->hex" ? "hex" : "eep",
            Invocation: rule === "elf->hex" ?
                        [exefile, "-O ihex -R .eepprop ${SRCFILE} ${DSTFILE}"] :
                        [exefile, "-O ihex -j .eeprom " +
                            "--set-section-flags=.eeprom=alloc,load " +
                            "--no-change-warnings --change-section-lma "+
                            ".eeprom=0 ${SRCFILE} ${DSTFILE}"],
        });
    }
}

class PostCompile extends ToolCli
{
    constructor(ts)
    {
        let exefile = "teensy_post_compile";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw(new Error("Can't resolve teensy postcompile executable"));
        super(ts, "teensy/postcompile", {
            Role: "teensy/download",
            Semantics: ToolCli.Semantics.OneToNone,
            ActionStage: "test",
            Invocation: [exefile, "-file=${SRCFILEBASENOEXT} " +
                       "-path=${BUILTDIR}} ${FLAGS}"],
        });
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        task.AddFlags([
            task.Interpolate("-tools=${TEENSYTOOLS}"),
            task.Interpolate("-board=${TEENSYBOARD}"),
            "-reboot"
        ]);
    }
}

exports.AR = AR;
exports.ObjCopy = ObjCopy;
exports.PostCompile = PostCompile;
