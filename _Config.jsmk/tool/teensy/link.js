let ToolCli = jsmk.Require("tool_cli.js").Tool;

class Link extends ToolCli
{
    constructor(toolset)
    {
        super(toolset, "teensy/link",
            {
                Role: "linker/c",
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: "a",
                ActionStage: "build",
                Invocation: "arm-none-eabi-gcc ${FLAGS} " +
                                "-o ${DSTFILE} ${SRCFILES}",
                Syntax:
                {
                    flag: "${VAL}"
                },
            }
        );
    }

    ConfigureTaskSettings(settings)
    {
        super.ConfigureTaskSettings(settings);
        settings.AddFlags([
            "-O",
            "-Wl,--gc-sections,--relax,--defsym=__rtc_localtime=1432291410",
            "-mthumb",
            "-L${TEENSYSRC}",
            "_inheritlist:lib.${TEENSYBOARD}",
            "-lm",
        ]);

        switch(settings.BuildVars.TEENSYBOARD)
        {
        case "TEENSY31":
            settings.AddFlags([
                "-T${TEENSYSRC}/mk20dx256.ld",
                "-mcpu=cortex-m4",
                "-larm_cortexM4l_math",
            ]);
            break;
        case "TEENSYLC":
            settings.AddFlags([
                "-T${TEENSYSRC}/mkl26z64.ld",
                "--specs=nano.specs",
                "-mcpu=cortex-m0plus",
                "-larm_cortexM0l_math",
            ]);
            break;
        }
    }
}  // end of link

exports.Link = Link;
