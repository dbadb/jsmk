/* global jsmk */
var Foundation = require("./foundation.js").Foundation;
class Arduino extends Foundation
{
     constructor(board="uno", ardroot="${HOME}/Documents/arduino-1.8.12")
     {
        super(__filename, "arduino", board)

        let userlibs = jsmk.Interpolate("${HOME}/Arduino/libraries");
        let pkgdir = jsmk.Interpolate("${HOME}/AppData/Local/Arduino15/packages/arduino");
        let pkgtools = jsmk.path.join(pkgdir, "tools");
        let ts = jsmk.path.join(pkgtools, "avr-gcc/7.3.0-atmel3.6.1-arduino7");
        let tsbin = jsmk.path.join(ts, "bin");
        let tslibexec = jsmk.path.join(ts, "libexec/gcc/avr/7.3.0");
        let avrtools = jsmk.path.join(pkgdir, "tools");
        let hardware = jsmk.path.join(pkgdir, "hardware/avr/1.8.3");

        let variant = 
        {
            "uno": "standard",
            "leonardo": "leonardo", 
            // yun, gemma, ...
        }[board];

        let map = {};

        // BuildVars are referenced by FLAGS, DEFINES, SEARCHPATHS across
        // multiple tools.
        map.BuildVars =
        {
            ARDROOT: jsmk.Interpolate(ardroot),
            ARD_VERS: 10812,
            ARD_CORE: jsmk.path.join(hardware, "cores/arduino"),
            ARD_VARIANT: jsmk.path.join(hardware, "variants", variant),
            ARD_SDK: jsmk.path.join(hardware, "/sdk"),
            ARD_CORELIBS: jsmk.path.join(hardware, "libraries"),/* where SPI, etc are located */
            ARD_USERLIBS: userlibs,
            ARD_TOOLS: jsmk.path.join(pkgdir, "tools"), /* where avrdude resides */
            ARD_BOARD: board,
            ARD_PORT: "COM3",
            ARD_BOOTFILE: jsmk.path.join("XXX"),

            OPTIMIZATION: "Size"
        };

        Object.assign(map.BuildVars, {
            "uno": 
            {
                ARD_CPU_FREQ: "16000000L",
                ARD_MCU: "atmega328p",
                ARDUINO_ARCH_AVR: null,
            }
        }[board]);

        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/arduino/cc.js");
        let link = jsmk.LoadConfig("tool/arduino/link.js");
        let misc = jsmk.LoadConfig("tool/arduino/misc.js");

        let CC = jsmk.path.join(tsbin, "avr-gcc");
        let SC = jsmk.path.join(tsbin, "avr-gcc"); // not avr-as
        let CPP = jsmk.path.join(tsbin, "avr-g++");
        let AR = jsmk.path.join(tsbin, "avr-ar");
        let LTOPLUGIN = jsmk.path.join(tslibexec, "liblto_plugin-0.dll");
        let LD = CC;
        let OBJCOPY = jsmk.path.join(tsbin, "avr-objcopy");
        let SIZES = jsmk.path.join(tsbin, "avr-size")
        let AVRDUDE = jsmk.path.join(avrtools, "avrdude/6.3.0-arduino17/bin/avrdude");
        let AVRDUDE_CONF = jsmk.path.join(avrtools, "avrdude/6.3.0-arduino17/etc/avrdude.conf");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this, CPP),
                "c->o": new cc.CC(this, CC),
                "S->o": new cc.CC(this, SC),
                "o->a": new misc.AR(this, AR, LTOPLUGIN),
                "cpp.o->elf": new link.Link(this, LD),
                "elf->eep": new misc.ObjCopy(this, OBJCOPY, "elf->eep"), // eeprom (data)
                "elf->hex": new misc.ObjCopy(this, OBJCOPY, "elf->hex"), // non-data
                "sizes": new misc.ElfSizes(this, SIZES),
                "deploy": new misc.Deploy(this, AVRDUDE, AVRDUDE_CONF)
            }
        );
        jsmk.DEBUG(`arduino/${board} toolset loaded`);
    } // end constructor
}

exports.Toolset = Arduino;
