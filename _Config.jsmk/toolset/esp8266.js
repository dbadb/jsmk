//
// esp8266 toolset supports mini d1, generic
//
// board-specific parameters:
//     - ESP_FLASH
//
// https://www.espressif.com/sites/default/files/documentation/2a-esp8266-sdk_getting_started_guide_en.pdf
//
//
/* global jsmk */
//
var Foundation = require("./foundation.js").Foundation;

class esp8266 extends Foundation
{
    constructor(board="generic")
    {
        super(__filename, "esp8266", board);

        let ardroot = "c:/Users/dana/arduino-1.8.12";
        let userlibs = "c:/Users/dana/Documents/Arduino/libraries";
        let pkgdir = "c:/Users/dana/AppData/Local/Arduino15/packages/esp8266";
        let pkgtools = jsmk.path.join(pkgdir, "tools");
        let ts = jsmk.path.join(pkgtools, "xtensa-lx106-elf-gcc/2.5.0-4-b40a506");
        let tsbin = jsmk.path.join(ts, "bin");
        let CC = jsmk.path.join(tsbin, "xtensa-lx106-elf-gcc");
        let SC = jsmk.path.join(tsbin, "xtensa-lx106-elf-gcc");
        let CPP = jsmk.path.join(tsbin, "xtensa-lx106-elf-g++");
        let AR = jsmk.path.join(tsbin, "xtensa-lx106-elf-ar");
        let LD = CC;
        // let OBJCOPY = jsmk.path.join(tsbin, "xtensa-lx106-elf-objcopy");

        let hardware = jsmk.path.join(pkgdir, "hardware/esp8266/2.7.4");
        let htools = jsmk.path.join(hardware, "tools");
        let elf2bin = jsmk.path.join(htools, "elf2bin.py"); 
        let flash = jsmk.path.join(htools, "upload.py"); 
        let sizes = jsmk.path.join(htools, "sizes.py"); 
        let sign = jsmk.path.join(htools, "signing.py"); 
        let python3 = jsmk.path.join(pkgtools, "python3/3.7.2-post1/python");
        let map = {};
        let variant = {
            "generic": "generic",
            "robodyn": "generic",
            "d1_mini": "generic",
        }[board];
        map.BuildVars =
        {
            ARD_VERS: 10812,
            ARD_SDK: jsmk.path.join(hardware, "tools/sdk"),
            ARD_CORE: jsmk.path.join(hardware, "cores/esp8266"),
            ARD_VARIANT: jsmk.path.join(hardware, "variants/" + variant),
            ARD_CORELIBS: jsmk.path.join(hardware, "libraries"),
            ARD_APPLIBS: jsmk.path.join(ardroot, "libraries"),
            ARD_USERLIBS: userlibs,
            ARD_TOOLS: jsmk.path.join(hardware, "tools"),
            ARD_BOARD: board,
            ARD_PORT: "COM3",
            ARD_CPU_FREQ: "80000000L",
            ARD_BOOTFILE: jsmk.path.join(hardware, "bootloaders/eboot/eboot.elf"),

            ESP_SDK: "NONOSDK22x_190703", 
            ESP_BIN: tsbin,
            ESP_FLASH_SIZE: {
                "generic": "1M",
                "d1_mini": "1M",
                "robodyn": "16M",
            }[board],
            ESP_FLASH_LD: {
                "generic": "eagle.flash.1m64.ld", // default in arduino ide
                "d1_mini": "eagle.flash.1m64.ld", 
                "robodyn": "eagle.flash.16m15m.ld",
            }[board],
            OPTIMIZATION: "Size",
        };

        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/esp8266/cc.js");
        let link = jsmk.LoadConfig("tool/esp8266/link.js");
        let misc = jsmk.LoadConfig("tool/esp8266/misc.js");
        let ldfile = jsmk.path.join(hardware, "tools/sdk/ld/eagle.app.v6.common.ld.h");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this, CPP),
                "c->o": new cc.CC(this, CC),
                "S->o": new cc.SC(this, SC),
                "o->a": new misc.AR(this, AR),
                "->ld": new cc.PRELOAD(this, CC, ldfile),
                "cpp.o->elf": new link.Link(this, LD),
                "elf->bin": new misc.Elf2Bin(this, python3, elf2bin, "elf->bin"),
                "sizes": new misc.ElfSizes(this, python3, sizes, "sizes"),
                "sign": new misc.SignBin(this, python3, sign, "sign"),
                "deploy": new misc.Deploy(this, python3, flash, "upload"),
            }
        );
        jsmk.DEBUG("esp8266 toolset loaded");
    } // end constructor
}

exports.Toolset = esp8266;
