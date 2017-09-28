//
// esp8266 toolset supports  mini d1,
//
/* global jsmk */
//
var Foundation = require("./foundation.js").Foundation;

class esp8266 extends Foundation
{
    constructor()
    {
        let board = "d1_mini";
        super(__filename, "esp8266", board);

        let ardroot = "D:/dana/arduino-1.6.12";
        let userlibs = "C:/Users/danab/Documents/Arduino/libraries";
        let tsdir = "C:/Users/danab/AppData/Local/Arduino15/packages/esp8266/tools";
        let ts = jsmk.path.join(tsdir, "xtensa-lx106-elf-gcc/1.20.0-26-gb404fb9-2");
        let hardware = jsmk.path.join(ardroot, "hardware/esp8266com/esp8266");
        let tsbin = jsmk.path.join(ts, "bin");
        let CC = jsmk.path.join(tsbin, "xtensa-lx106-elf-gcc");
        let SC = jsmk.path.join(tsbin, "xtensa-lx106-elf-gcc");
        let CPP = jsmk.path.join(tsbin, "xtensa-lx106-elf-g++");
        let AR = jsmk.path.join(tsbin, "xtensa-lx106-elf-ar");
        let LD = CC;
        // let OBJCOPY = jsmk.path.join(tsbin, "xtensa-lx106-elf-objcopy");
        let ESPTOOL = jsmk.path.join(tsdir, "esptool/0.4.9/esptool");
        let map = {};


        map.BuildVars =
        {
            ARD_VERS: 10612,
            ARD_SDK: jsmk.path.join(hardware, "tools/sdk"),
            ARD_CORE: jsmk.path.join(hardware, "cores/esp8266"),
            ARD_VARIANT: jsmk.path.join(hardware, "variants/" + board),
            ARD_CORELIBS: jsmk.path.join(hardware, "libraries"),
            ARD_APPLIBS: jsmk.path.join(ardroot, "libraries"),
            ARD_USERLIBS: userlibs,
            ARD_TOOLS: jsmk.path.join(hardware, "tools"),
            ARD_BOARD: board,
            ARD_PORT: "COM9",
            ARD_CPU_FREQ: "80000000L",
        };

        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/esp8266/cc.js");
        let link = jsmk.LoadConfig("tool/esp8266/link.js");
        let misc = jsmk.LoadConfig("tool/esp8266/misc.js");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this, CPP),
                "c->o": new cc.CC(this, CC),
                "S->o": new cc.SC(this, SC),
                "cpp.o->elf": new link.Link(this, LD),
                "o->a": new misc.AR(this, AR),
                "elf->bin": new misc.EspTool(this, ESPTOOL, "elf->bin"),
                "flash": new misc.EspTool(this, ESPTOOL, "flash"),
            }
        );
        jsmk.DEBUG("esp8266 toolset loaded");
    } // end constructor
}

exports.Toolset = esp8266;
