let ToolCli = jsmk.Require("tool_cli.js").Tool;

// Here we define two classes,  CC and CPP..
//
// It's possible that teensy is better represented as a framework
// rather than a compiler.  On the other hand, the choice of compiler
// is pretty-well tied down by teensy (and tightly coupled with
// its collection of compiler flags).
class CC extends ToolCli
{
    constructor(toolset, invoc)
    {
        let gcc = invoc ? invoc : "gcc";
        super(toolset, "teensy/cc",
            {
                Role: "compiler/c",
                Semantics: ToolCli.Semantics.ManyToMany,
                DstExt: "o",
                ActionStage: "build",
                Invocation: `arm-none-eabi-${gcc}` +
                             " ${SRCFILE} -o ${DSTFILE}" +
                             " ${FLAGS} ${DEFINES} ${INCLUDES}",
                Syntax: {
                    define: "-D${KEY}=${VAL}",
                    include: "-I${VAL}",
                    flag: "${VAL}"
                },
            });
    }

    ConfigureTaskSettings(settings)
    {
        super.ConfigureTaskSettings(settings);

        settings.Define( {
            ARDUINO: "10605",
            TEENSYDUINO: "124",
            ARDUINO: "10605",
            ARDUINO_ARCH_AVR: null,
            //USB_SERIAL_NEWHID:   null,
            USB_SERIAL_HID:   null,
            LAYOUT_US_ENGLISH: null,
            __TEENSYBOARD:  null
        });

        settings.AddFlags([
                "-c",
                "-Wall",
                "-ffunction-sections",
                "-fdata-sections",
                "-MMD", // for mkdep
                "-nostdlib",
                "-fno-exceptions",
                "-mthumb",
                "-fno-rtti",
                "-std=gnu++0x",
                "-felide-constructors",
            ]);

        switch(settings.BuildVars.TEENSYBOARD)
        {
        case "TEENSY31":
            settings.Define({
                    F_CPU: "96000000",
                    "__MK20DX256__": null,
                });
            settings.AddFlags([
                    "-mcpu=cortex-m4",
                ]);
            break;
        case "TEENSYLC":
            settings.Define({
                    F_CPU: "48000000",
                    "__MKL26Z64__":  null,
                }),
            settings.AddFlags([
                    "-mcpu=cortex-m0plus",
                ]);
            break;
        default:
            jsmk.WARNING("Teensy compiler requires TEENSYBOARD selection");
        }

        switch(settings.BuildVars.DEPLOYMENT)
        {
        case "debug":
            settings.AddFlags([
                "-g",
            ]);
            break;
        case "release":
            settings.AddFlags([
                "-O",
            ]);
            break;
        }
    }
}

class CPP extends CC
{
    constructor(toolset)
    {
        super(toolset, "g++");
    }
}

exports.CC = CC;
exports.CPP = CPP;
