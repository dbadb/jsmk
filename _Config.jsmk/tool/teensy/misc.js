let ToolCli = jsmk.Require("tool_cli.js").Tool;

class AR extends ToolCli
{
    constructor(toolset)
    {
        super(toolset, "teensy/ar", {
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: "arm-none-eabi-ar cr ${DSTFILE} ${SRCFILES}"
        });
    }
}

class ObjCopy extends ToolCli
{
    constructor(toolset, rule)
    {
        super(toolset, "teensy/objcopy", {
            Role: "teensy/objcopy",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: rule === "elf->hex" ? "hex" : "eep",
            Invocation: rule === "elf->hex" ?
                        ("arm-none-eabi-objcopy -O ihex -R " +
                            ".eepprop ${SRCFILE} ${DSTFILE}") :
                        ("arm-none-eabi-objcopy -O ihex -j .eeprom " +
                            "--set-section-flags=.eeprom=alloc,load " +
                            "--no-change-warnings --change-section-lma "+
                            ".eeprom=0 ${SRCFILE} ${DSTFILE}"),
        });
    }
}

class PostCompile extends ToolCli
{
    constructor(toolset)
    {
        super(toolset, "teensy/postcompile", {
            Role: "teensy/download",
            Semantics: ToolCli.Semantics.OneToNone,
            ActionStage: "test",
            Invocation: "teensy_post_compile -file=${SRCFILEBASENOEXT} " +
                       "-path=${JsmkBuiltDir.module} ${FLAGS}",
        });
    }

    ConfigureTaskSettings(settings)
    {
        super.ConfigureTaskSettings(settings);
        settings.AddFlags([
            "-tools=${TEENSYTOOLS}",
            "-board=${TEENSYBOARD}",
            "-reboot"
        ]);
    }
}

exports.AR = AR;
exports.ObjCopy = ObjCopy;
exports.PostCompile = PostCompile;
