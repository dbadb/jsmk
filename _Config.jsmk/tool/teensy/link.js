/* global jsmk */

let ToolCli = jsmk.Require("tool_cli.js").Tool;

// see toolchain.txt for refs
class Link extends ToolCli
{
    constructor(ts)
    {
        let exefile = "arm-none-eabi-g++";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        super(ts, "teensy/link",
            {
                Role: ToolCli.Role.Link,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: "elf",
                ActionStage: "build",
                Invocation: [arg0, "-o ${DSTFILE} ${SRCFILES} ${FLAGS}"],
                Syntax:
                {
                    Flag: "${VAL}"
                },
        }); 

        let tsrc = ts.BuildVars.TEENSYSRC;
        let tboard = ts.BuildVars.TEENSYBOARD;
        this.AddFlags(this.GetRole(), [
            "-Os",
            "-Wl,--gc-sections,--relax,--defsym=__rtc_localtime="+Date.now(),
            "-mthumb",
            `-L${tsrc}`,
            "-fsingle-precision-constant",
        ]);

        switch(tboard)
        {
        case "TEENSY41":
            this.AddFlags(this.GetRole(), [
                "-mcpu=cortex-m7",
                "-mfpu=fpv5-d16",
                "-mfloat-abi=hard",
                `-T${tsrc}/imxrt1062_t41.ld`,
                "-larm_cortexM7lfsp_math",
            ]);
            break;
        case "TEENSY40":
            this.AddFlags(this.GetRole(), 
            [
                "-mcpu=cortex-m7",
                "-mfpu=fpv5-d16",
                "-mfloat-abi=hard",
                `-T${tsrc}/imxrt1062.ld`,
                "-larm_cortexM7lfsp_math",
            ]);
            break;
        case "TEENSY31":
            this.AddFlags(this.GetRole(), [
                `-T${tsrc}/mk20dx256.ld`,
                "-mcpu=cortex-m4",
                "-larm_cortexM4l_math",
            ]);
            break;
        case "TEENSYLC":
            this.AddFlags(this.GetRole(), [
                `-T${tsrc}/mkl26z64.ld`,
                "--specs=nano.specs",
                "-mcpu=cortex-m0plus",
                "-larm_cortexM0l_math",
            ]);
            break;
        }

        this.AddFlags(this.GetRole(), 
        [
            "-lm",
            "-lstdc++"
        ]);
    }

}  // end of link

exports.Link = Link;
