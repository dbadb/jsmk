let ToolCli = jsmk.Require("tool_cli.js").Tool;

class Link extends ToolCli
{
    constructor(ts)
    {
        let exefile = "arm-none-eabi-gcc";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        super(ts, "teensy/link",
            {
                Role: "linker/c",
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: "elf",
                ActionStage: "build",
                Invocation: [arg0,
                             "-o ${DSTFILE} ${SRCFILES} ${FLAGS}"],
                Syntax:
                {
                    Flag: "${VAL}"
                },
            }
        );
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        let tsrc = task.BuildVars.TEENSYSRC;
        let tboard = task.BuildVars.TEENSYBOARD;
        task.AddFlags([
            "-O",
            "-Wl,--gc-sections,--relax,--defsym=__rtc_localtime="+Date.now(),
            "-mthumb",
            `-L${tsrc}`,
            "-lm",
        ]);

        switch(tboard)
        {
        case "TEENSY31":
            task.AddFlags([
                `-T${tsrc}/mk20dx256.ld`,
                "-mcpu=cortex-m4",
                "-larm_cortexM4l_math",
            ]);
            break;
        case "TEENSYLC":
            task.AddFlags([
                `-T${tsrc}/mkl26z64.ld`,
                "--specs=nano.specs",
                "-mcpu=cortex-m0plus",
                "-larm_cortexM0l_math",
            ]);
            break;
        }
    }
}  // end of link

exports.Link = Link;
