/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

// avr-ar Math.cpp.o: plugin needed to handle lto object
// 
class AR extends ToolCli
{
    constructor(ts, exefile, ltopluginpath)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile);
        if(!arg0) throw new Error("Can't resolve arduino AR executable");
        super(ts, "arduino/ar", {
            Role:  ToolCli.Role.Archive,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "a",
            Invocation: [arg0, 
                "crs",
                "--plugin", ltopluginpath,
                "${DSTFILE}",
                "${SRCFILES}"]
        });
    }
}

// elf2bin: Generate an Arduino compatible BIN file from bootloader and sketch 
//          ELF. 
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

// ObjCopy used for two rules: elf->eep, elf->hex
class ObjCopy extends ToolCli
{
    constructor(ts, exefile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) 
            throw new Error("Can't resolve arduino objcopy");

        super(ts, "arduino/objcopy", {
            Role: ToolCli.Role.Extract,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.OneToOne,
            Syntax:
            {
                Flag: "${VAL}"
            },
            DstExt: rule === "elf->hex" ? "hex" : "eep",
            Invocation: [arg0, 
                    "${FLAGS}",
                    "${SRCFILE}",
                    "${DSTFILE}"]
        });

        if(rule === "elf->hex")
        {
            this.AddFlags(this.GetRole(),
            [
                ["-O", "ihex"],
                ["-R", ".eepprop"],
            ]);
        }
        else
        if(rule === "elf->eep")
        {
            this.AddFlags(this.GetRole(),
            [
                ["-O", "ihex"],
                ["-j", ".eeprom"],
                "--set-section-flags=.eeprom=alloc,load",
                "--no-change-warnings",
                "--change-section-lma",
                ".eeprom=0",
            ]);
        }
        else
            throw("Unknown objcopy rule " + rule);
    }
}

class ElfSizes extends ToolCli
{
    constructor(ts, exefile, rule)
    {
        let arg0 = jsmk.path.resolveExeFile(exefile);
        if(!arg0) 
            throw new Error("Can't resolve sizes executable " + exefile);
        super(ts, "arduino/sizes", 
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
                arg0,  "-A", "${SRCFILE}"
            ],
        });
    }
}

// Deploy:
// Wrapper for Arduino core / others that can call avrdude
//
// ${HOME}\AppData\Local\Arduino15\packages\arduino\tools\avrdude\6.3.0-arduino17/bin/avrdude 
//    -C${HOME}\AppData\Local\Arduino15\packages\arduino\tools\avrdude\6.3.0-arduino17/etc/avrdude.conf 
//    -v -patmega328p -carduino -PCOM3 -b115200 
//    -D -Uflash:w:${HOME}\AppData\Local\Temp\arduino_build_32073/BlinkUno.ino.hex:i
//
class Deploy extends ToolCli
{
    constructor(ts, exetool, cfgfile, rule)
    {        
        let arg0 = jsmk.path.resolveExeFile(exetool);
        if(!arg0) 
            throw new Error("Can't resolve executable " + exetool);
        let port = ts.BuildVars.ARD_PORT;
        super(ts, "arduino/deploy", 
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
            LiveOutput: true,
            Invocation: [arg0, 
                    `-C${cfgfile}`,
                    "-v",
                    "-p${ARD_MCU}",
                    "-carduino",
                    `-P${port}`,
                    "-b", "115200",
                    "-D",
                    "-Uflash:w:${SRCFILE}:i"
                ],
        });
    }
}

exports.AR = AR;
exports.ObjCopy = ObjCopy;
exports.ElfSizes = ElfSizes;
exports.Deploy = Deploy;
