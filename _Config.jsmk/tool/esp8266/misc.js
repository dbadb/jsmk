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

// elf2bin: Generate an Arduino compatible BIN file from bootloader and sketch 
//          ELF. Replaces esptool-ck.exe and emulates its behavior.
//
// Arduino15\\packages\\esp8266\\tools\\python3\\3.7.2-post1/python3" 
// "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/tools/elf2bin.py" 
// --eboot "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/bootloaders/eboot/eboot.elf" 
// --app "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.elf" 
// --flash_mode dout --flash_freq 40 --flash_size 1M 
// --path "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\xtensa-lx106-elf-gcc\\2.5.0-4-b40a506/bin" 
// --out "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.bin"
class Elf2Bin extends ToolCli
{
    constructor(ts, python, scriptfile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(python);
        if(!arg0) 
            throw new Error("Can't resolve python3 executable " + python);
        let bootfile = ts.BuildVars.ARD_BOOTFILE;
        let flashsize = ts.BuildVars.ESP_FLASH_SIZE;
        super(ts, "esp8266/elf2bin", 
        {
            Role: ToolCli.Role.Extract,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: "bin",
            Syntax:
            {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
            Invocation: [arg0, scriptfile, "--eboot", bootfile,
                    "--app", "${SRCFILE}",
                    "${FLAGS}",
                    "--path", ts.BuildVars.ESP_BIN,
                    "--out", "${DSTFILE}"]
        });
        this.AddFlags(this.GetRole(),
        [
            ["--flash_mode", "dout"],
            ["--flash_freq", "40"],
            ["--flash_size", flashsize] // like "1MB"
        ]);
    }
}


// "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\python3\\3.7.2-post1/python3" 
// "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/tools/sizes.py" 
//  --elf "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.elf" 
//  --path "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\xtensa-lx106-elf-gcc\\2.5.0-4-b40a506/bin"
//
// NB: there's another size report that may be of interest
//  "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\xtensa-lx106-elf-gcc\\2.5.0-4-b40a506/bin/xtensa-lx106-elf-size" 
//      -A "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.elf"
// reports:
//    Sketch uses 267196 bytes (27%) of program storage space. Maximum is 958448 bytes.
//    Global variables use 27036 bytes (33%) of dynamic memory, leaving 54884 bytes for local variables. Maximum is 81920 bytes.
//
class ElfSizes extends ToolCli
{
    constructor(ts, python, scriptfile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(python);
        if(!arg0) 
            throw new Error("Can't resolve python3 executable " + python);
        else
            jsmk.DEBUG("ElfSizes using python here:" + arg0);
        super(ts, "esp8266/sizes", 
        {
            Role: ToolCli.Role.Report,
            ActionStage: "test",
            Semantics: ToolCli.Semantics.OneToNone,
            Syntax:
            {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
            Invocation: [
                arg0, scriptfile, 
                "--elf", "${SRCFILE}",
                "--path", ts.BuildVars.ESP_BIN
            ],
        });
    }
}

// "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\python3\\3.7.2-post1/python3" 
// "${HOME}\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/tools/signing.py" 
// --mode sign 
// --privatekey "${HOME}\\Documents\\Arduino\\sketches\\WIFIUnoTest/private.key" 
// --bin "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.bin" 
// --out "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.bin.signed" 
// --legacy "${HOME}\\AppData\\Local\\Temp\\arduino_build_278104/WIFIUnoTest.ino.bin.legacy_sig"
class SignBin extends ToolCli
{
    constructor(ts, python, scriptfile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(python);
        if(!arg0) 
            throw new Error("Can't resolve python3 executable " + python);

        // NB: signing isn't fully implemented!

        super(ts, "esp8266/signbin", 
        {
            Role: ToolCli.Role.Sign,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: "bin",
            Syntax:
            {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
            Invocation: [arg0, scriptfile]
        });
    }
}

class MkLittleFS extends ToolCli
{
    constructor(ts, exefile)
    {        
        let arg0 = jsmk.path.resolveExeFile(exefile);
        if(!arg0) 
            throw new Error("Can't resolve MkLittleFS executable " + exefile);
        super(ts, "esp8266/mklittlefs", 
        {
            Role: ToolCli.Role.Compile,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            DstExt: "mklittlefs.bin",
            Syntax:
            {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
            /* expect that this is a task-specific buildvar 
             * must be multiple of blocksize (which defaults to 4096) */
            /* these values obtained from:
                https://github.com/earlephilhower/arduino-esp8266littlefs-plugin/blob/master/src/ESP8266LittleFS.java
             */
            Invocation: [arg0, 
                    "-c", "${SRCFILE}",
                    "-p", "${PAGE_SIZE}",
                    "-b", "${BLOCK_SIZE}",
                    "-s", "${SPIFFSIZE}", 
                    "${DSTFILE}"
                ],
        });
    }
}

// Deploy:
// Wrapper for Arduino core / others that can call esptool.py possibly multiple times
// Adds pyserial to sys.path automatically based on the path of the current file
// First parameter is pyserial path, second is esptool path, then a series of command arguments
// i.e. python3 upload.py write_flash file 0x0
// ${HOME}\AppData\Local\Arduino15\packages\esp8266\tools\python3\3.7.2-post1/python3 
// ${HOME}\AppData\Local\Arduino15\packages\esp8266\hardware\esp8266\2.7.4/tools/upload.py 
//  --chip esp8266
//  --port COM3 
//  --baud 115200 
//  --before default_reset 
//  --after hard_reset write_flash 0x0 
//   ${HOME}\AppData\Local\Temp\arduino_build_278104/WIFIUnoTest.ino.bin 
class Deploy extends ToolCli
{
    constructor(ts, python, scriptfile, rule)
    {        
        let arg0 = jsmk.path.resolveExeFile(python);
        if(!arg0) 
            throw new Error("Can't resolve python3 executable " + python);
        super(ts, "esp8266/deploy", 
        {
            Role: ToolCli.Role.Deploy,
            ActionStage: "test",
            Semantics: ToolCli.Semantics.OneToNone,
            DstExt: "",
            Syntax:
            {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
            BuildVars:
            {
                DEPLOY_OFFSET: "${CODE_DEPLOY_OFFSET}"
            },
            LiveOutput: true,
            Invocation: [arg0, "-u", /* unbuffered */
                    scriptfile,
                    "--chip", "esp8266",
                    "--port", ts.BuildVars.ARD_PORT,
                    "--baud", "115200",
                    "--before", "default_reset",
                    "--after", "hard_reset",
                    "write_flash", 
                    "${DEPLOY_OFFSET}", // code: 0x, for FS
                    "${SRCFILE}"
                ],
        });
    }
}

exports.AR = AR;
exports.Elf2Bin = Elf2Bin;
exports.MkLittleFS = MkLittleFS;
exports.ElfSizes = ElfSizes;
exports.SignBin = SignBin;
exports.Deploy = Deploy;
