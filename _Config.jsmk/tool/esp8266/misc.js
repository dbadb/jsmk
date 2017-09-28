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

class EspTool extends ToolCli
{
    // NB: EspTool has unusual order-dependent argument parsing conventions
    //  this tool has two uses:
    //   1. convert an elf file to a downloadable binary.
    //   2. flash the binary to the esp

    // 1. recipe.objcopy.hex.pattern
    //  "{runtime.tools.esptool.path}/{compiler.esptool.cmd}" /
    //      -eo "{runtime.platform.path}/bootloaders/eboot/eboot.elf" \
    //      -bo "{build.path}/{build.project_name}.bin" \
    //      -bm {build.flash_mode} -bf {build.flash_freq} -bz {build.flash_size} \
    //      -bs .text -bp 4096 -ec -eo "{build.path}/{build.project_name}.elf" \
    //      -bs .irom0.text -bs .text -bs .data -bs .rodata -bc -ec
    // 2. tools.esptool.upload.pattern
    //  "{path}/{cmd}" {upload.verbose} \
    //      -cd {upload.resetmethod} -cb {upload.speed} -cp "{serial.port}" \
    //      -ca 0x00000 -cf "{build.path}/{build.project_name}.bin"
    //  eg: esptool -vv -cd nodemcu -cb 921600 -cp COM9 -ca 0x00000 \
    //          -cf file.elf.bin

    constructor(ts, exefile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile);
        if(!arg0) throw new Error("Can't resolve objcopp8266 executable");
        let bootfile = ts.BuildVars.ARD_BOOTFILE;
        super(ts, "esp8266/objcopy", {
            Role: ToolCli.Role.Extract,
            ActionStage: rule === "elf->bin" ? "build" : "test",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: rule === "elf->bin" ? "bin" : "",
            Invocation: rule === "elf->bin" ?
                [arg0, `-eo ${bootfile} ` +
                        "-bo ${DSTFILE} "+
                        "-bm dio -bf 40 -bz 4M "+
                        "-bs .text -bp 4096 -ec -eo ${SRCFILE} "+
                        "-bs .irom0.text -bs .text -bs .data -bs .rodata -bc -ec"] :
                [arg0, "-vv -cd nodemcu -cb 921600 " +
                        `-cp ${ts.BuildVars.ARD_PORT} ` +
                        "-ca 0x00000 -cf ${SRCFILE}"]
        });
    }
}

exports.AR = AR;
exports.EspTool = EspTool;
