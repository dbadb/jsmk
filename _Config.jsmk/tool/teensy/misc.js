/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class AR extends ToolCli
{
    constructor(ts)
    {
        let exefile = "arm-none-eabi-ar";
        let exefile2 = "arm-none-eabi-gcc-ar";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) 
        {
            arg0 = jsmk.path.resolveExeFile(exefile2, ts.BuildVars.TEENSYPATH);
            exefile = exefile2;
        }
        if(!arg0) 
            throw new Error("Can't resolve teensy AR executable " + 
                                  ts.BuildVars.TEENSYPATH + "/" + exefile);
        super(ts, "teensy/ar", {
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
    constructor(ts, rule)
    {
        let exefile = "arm-none-eabi-objcopy";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw new Error("Can't resolve teensy objcopy executable");
        super(ts, "teensy/objcopy", {
            Role: ToolCli.Role.Extract,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: rule === "elf->hex" ? "hex" : "eep",
            Invocation: rule === "elf->hex" ?
                [arg0, "-O ihex -R .eepprop ${SRCFILE} ${DSTFILE}"] :
                [arg0, "-O ihex -j .eeprom " +
                        "--set-section-flags=.eeprom=alloc,load " +
                        "--no-change-warnings --change-section-lma "+
                        ".eeprom=0 ${SRCFILE} ${DSTFILE}"],
        });
    }
}

class ReportSize extends ToolCli
{
    constructor(ts)
    {
        let exefile = "arm-none-eabi-size";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw new Error("Can't resolve teensy size executable");
        super(ts, "teensy/size", {
            Role: ToolCli.Role.Report,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToNone,
            Invocation: [arg0, "-A ${SRCFILE}"] ,
        });
    }

    /* sample output
    .../Playground.elf  :
    section                 size        addr
    .text                  41808           0
    .fini                      4       41808
    .usbdescriptortable      192   536868864
    .dmabuffers              192   536869120
    .usbbuffers             2160   536869312
    .data                    488   536871472
    .bss                    1304   536871960
    .ARM.attributes           40           0
    .comment                 110           0
    .debug_info           465272           0
    .debug_abbrev          56195           0
    .debug_loc             74290           0
    .debug_aranges          6352           0
    .debug_ranges           9264           0
    .debug_line            83615           0
    .debug_str            111135           0
    .debug_frame           18868           0
    Total                 871289
    */
    filterOutput(chan, txt, task, outfile)
    {
        let lines = txt.split("\n");
        let result = txt;
        for(let l of lines)
        {
            let fields = l.split(/[\s]+/); // split on whitespace
            // console.log(fields);
            if(fields[0] == ".text")
            {
                // override the output
                result = `Sketch uses ${fields[1]} bytes`;
            }
        }
        return result;
    }
}

class PostCompile extends ToolCli
{
    // ...\arduino-1.8.12\hardware\teensy/../tools/teensy_post_compile \
    //  -file=BlinkTeensy.ino \
    //  -path=C:\Users\dana\AppData\Local\Temp\arduino_build_530257 \
    //  -tools=C:\Users\dana\Documents\arduino-1.8.12\hardware\teensy/../tools \
    //  -board=TEENSYLC -reboot -port=COM5 -portlabel=COM5 \
    //  -portprotocol=serial 

    constructor(ts)
    {
        let exefile = "teensy_post_compile";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw new Error("Can't resolve teensy postcompile executable");
        super(ts, "teensy/postcompile", {
            Role: ToolCli.Role.Deploy,
            Semantics: ToolCli.Semantics.OneToNone,
            ActionStage: "test",
            Invocation: [arg0, "-file=${SRCFILEBASENOEXT} " +
                       "-path=${BUILTDIR} " +
                       "${FLAGS} " + // -tools and -board filled in ConfigureTaskSettings
                       "-reboot -portprotocol=serial"],
            Syntax:
            {
                Flag: "${VAL}"
            },
        });
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        task.AddFlags(this.GetRole(), [
            task.Interpolate("-tools=${TEENSYTOOLS}"),
            task.Interpolate("-board=${TEENSYBOARD}"),
        ]);
    }
}

exports.AR = AR;
exports.ObjCopy = ObjCopy;
exports.PostCompile = PostCompile;
exports.ReportSize = ReportSize;
