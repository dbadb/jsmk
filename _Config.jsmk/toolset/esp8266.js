// esp8266 toolset supports mini d1, generic, robodyn
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
        let mklittlefs = jsmk.path.join(pkgtools, "mklittlefs/2.5.0-4-fe5bb56/mklittlefs");
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
        // see boards.txt in 
        // AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4
        //  generic.menu.eesz.4M3M.build.flash_size=4M
        //  generic.menu.eesz.4M3M.build.flash_size_bytes=0x400000
        //  generic.menu.eesz.4M3M.build.flash_ld=eagle.flash.4m3m.ld
        //  generic.menu.eesz.4M3M.build.spiffs_pagesize=256
        //  generic.menu.eesz.4M3M.upload.maximum_size=1044464
        //  generic.menu.eesz.4M3M.build.rfcal_addr=0x3FC000
        //  generic.menu.eesz.4M3M.build.spiffs_start=0x100000
        //  generic.menu.eesz.4M3M.build.spiffs_end=0x3FA000
        //  generic.menu.eesz.4M3M.build.spiffs_blocksize=8192
        // https://www.espressif.com/sites/default/files/documentation/2a-esp8266-sdk_getting_started_guide_en.pdf
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
            OPTIMIZATION: "Size",
            CODE_DEPLOY_OFFSET: "0x0",
            // see boards.txt in 
            // AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4
            //  generic.menu.eesz.4M3M.build.flash_size=4M
            //  generic.menu.eesz.4M3M.build.flash_size_bytes=0x400000
            //  generic.menu.eesz.4M3M.build.flash_ld=eagle.flash.4m3m.ld
            //  generic.menu.eesz.4M3M.build.spiffs_pagesize=256
            //  generic.menu.eesz.4M3M.upload.maximum_size=1044464
            //  generic.menu.eesz.4M3M.build.rfcal_addr=0x3FC000
            //  generic.menu.eesz.4M3M.build.spiffs_start=0x100000
            //  generic.menu.eesz.4M3M.build.spiffs_end=0x3FA000
            //  generic.menu.eesz.4M3M.build.spiffs_blocksize=8192
        };
        let boardvars;
        switch(board)
        {
        case "generic": // untested (fill from boards.txt)
            boardvars =
            {
                PAGE_SIZE: 256,
                BLOCK_SIZE: 8192,
                SPIFFSIZE: (0x3FA000 - 0x100000), // 3048 * 1024
                ESP_FLASH_SIZE: "1M",
                ESP_FLASH_LD: "eagle.flash.4m3m.ld", // 3M partition
                FS_DEPLOY_OFFSET: "0x100000",
            };
            break;
        case "d1_mini": // untested (fill from boards.txt)
            boardvars =
            {
                PAGE_SIZE: 256,
                BLOCK_SIZE: 8192,
                SPIFFSIZE: (0x3FA000 - 0x100000), // 3048 * 1024
                ESP_FLASH_SIZE: "4M",
                ESP_FLASH_LD: "eagle.flash.4m3m.ld", // 3M partition
                FS_DEPLOY_OFFSET: "0x100000",
            };
            break;
        case "robodyn":
            boardvars =
            {
                PAGE_SIZE: 256,
                BLOCK_SIZE: 8192,
                SPIFFSIZE: (0x3FA000 - 0x100000), // 3048 * 1024
                ESP_FLASH_SIZE: "4M",
                ESP_FLASH_LD: "eagle.flash.4m3m.ld", // 3M partition
                FS_DEPLOY_OFFSET: "0x100000",
            };
            break;
        default:
            boardvars = {};
            break;
        }
        Object.assign(map.BuildVars, boardvars);
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
                "dir->littlefs": new misc.MkLittleFS(this, mklittlefs),
                "sizes": new misc.ElfSizes(this, python3, sizes, "sizes"),
                "sign": new misc.SignBin(this, python3, sign, "sign"),
                "deploy": new misc.Deploy(this, python3, flash, "upload"),
            }
        );
        jsmk.DEBUG("esp8266 toolset loaded");
    } // end constructor
}

exports.Toolset = esp8266;
