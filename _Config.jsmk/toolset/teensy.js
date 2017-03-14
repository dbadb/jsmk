var Foundation = require("./foundation.js").Foundation;

class Teensy extends Foundation
{
     constructor()
     {
        super(__filename, "teensy");

        let ardroot = "D:/dana/arduino-1.6.12";
        let dbcore  =  "D:/dana/src/teensy/libs/libcore/teensy-cores/teensy3";
        let teensycore  = jsmk.path.join(ardroot, "hardware/teensy/avr/cores/teensy3");
        let teensytools = jsmk.path.join(ardroot, "hardware/tools");
        let teensybin = jsmk.path.join(teensytools, "arm/bin");
        let map = {};

        map.BuildVars =
        {
            ARDROOT: ardroot,
            //TEENSYSRC: jsmk.path.join(ardroot, "hardware/teensy/avr/cores/teensy3"),
            TEENSYSRC: jsmk.path.join(dbcore),
            TEENSYLIBS: jsmk.path.join(ardroot, "hardware/teensy/avr/libraries"),
            TEENSYTOOLS: teensytools,
            // TEENSYBOARD: "TEENSY31",
            TEENSYBOARD: "TEENSYLC",
            TEENSYPATH:  [teensybin, teensytools],
        };

        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/teensy/cc.js");
        let link = jsmk.LoadConfig("tool/teensy/link.js");
        let misc = jsmk.LoadConfig("tool/teensy/misc.js");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this),
                "c->o": new cc.CC(this),
                "cpp.o->elf": new link.Link(this),
                "o->a": new misc.AR(this),
                "elf->eep": new misc.ObjCopy(this, "elf->eep"), // eeprom (data)
                "elf->hex": new misc.ObjCopy(this, "elf->hex"), // non-data
                "postcompile": new misc.PostCompile(this)
            }
        );
    } // end constructor
}

exports.Toolset = Teensy;
