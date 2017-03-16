let ToolCli = jsmk.Require("tool_cli.js").Tool;

// Here we define two classes,  CC and CPP..
//
// It's possible that teensy is better represented as a framework
// rather than a compiler.  On the other hand, the choice of compiler
// is pretty-well tied down by teensy (and tightly coupled with
// its collection of compiler flags).
class CC extends ToolCli
{
    constructor(ts, invoc)
    {
        let gcc = invoc ? invoc : "gcc";
        let exefile = `arm-none-eabi-${gcc}`;
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw("Can't resolve teensy CC executable");
        super(ts, "teensy/cc",
            {
                Role: "compiler/c",
                Semantics: ToolCli.Semantics.ManyToMany,
                DstExt: "o",
                ActionStage: "build",
                Invocation: [arg0, " ${SRCFILE} -o ${DSTFILE}" +
                                   " ${FLAGS} ${DEFINES} ${INCLUDES}"],
                Syntax: {
                    Define: "-D${KEY}=${VAL}",
                    DefineNoVal: "-D${KEY}",
                    Include: "-I${VAL}",
                    Flag: "${VAL}"
                },
            });

        this.Define( {
            ARDUINO: "10605",
            TEENSYDUINO: "124",
            ARDUINO: "10605",
            ARDUINO_ARCH_AVR: null,
            //USB_SERIAL_NEWHID:   null,
            USB_SERIAL_HID:   null,
            LAYOUT_US_ENGLISH: null,
            __TEENSYBOARD:  null
        });

        this.AddFlags([
                "-c",
                "-Wall",
                "-ffunction-sections",
                "-fdata-sections",
                "-MMD", // for mkdep
                "-nostdlib",
                "-fno-exceptions",
                "-mthumb",
            ]);

        if(gcc === "g++")
        {
            this.AddFlags([
                "-fno-rtti",
                "-std=gnu++0x",
                "-felide-constructors",
            ]);
        }

        this.Include( [
            "${TEENSYSRC}",
            "${TEENSYLIBS}"
        ]);
    } // end constructor

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        switch(task.BuildVars.TEENSYBOARD)
        {
        case "TEENSY31":
            task.Define({
                    F_CPU: "96000000",
                    "__MK20DX256__": null,
                });
            task.AddFlags([
                    "-mcpu=cortex-m4",
                ]);
            break;
        case "TEENSYLC":
            task.Define({
                    F_CPU: "48000000",
                    "__MKL26Z64__":  null,
                }),
            task.AddFlags([
                    "-mcpu=cortex-m0plus",
                ]);
            break;
        default:
            jsmk.WARNING("Teensy compiler requires TEENSYBOARD selection");
        }

        switch(task.BuildVars.Deployment)
        {
        case "debug":
            task.AddFlags([
                "-g",
            ]);
            break;
        case "release":
            task.AddFlags([
                "-O",
            ]);
            break;
        }
    }

    outputIsDirty(output, inputs, cwd)
    {
        let dirty = super.outputIsDirty(output, inputs, cwd);
        if(!dirty)
        {
            // also look for MMD output to see if any dependencies have changed

            let depfileTxt = jsmk.file.read(jsmk.file.changeExtension(output, "d"));
            if(depfileTxt)
            {
                let pat = /(?:[^\s]+\\ [^\s]+|[^\s]+)+/g;
                // pat looks for filenames, potentially with embedded spaces.
                // This also selects for line-continuation "\\" so we need
                // to filter that.
                // First line is the dependent file, so we slice it off.
                let files = depfileTxt.match(pat)
                .filter( (value)=>{
                    if(value[value.length-1] == ':')
                        return false;
                    else
                        return (value.length > 1);
                })
                .map((value)=>{
                    // Program\ Files -> Program Files
                    return value.replace(/\\ /g, " ");
                });
                return super.outputIsDirty(output, files, cwd);
            }
        }
        return dirty;
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
