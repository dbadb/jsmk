var Foundation = require("./foundation.js").Foundation;

class Teensy extends Foundation
{
     constructor()
     {
        super(__filename, "teensy");

        var ardroot = "C:Proga~2/Arduino";
        var teensytools = jsmk.path.join(ardroot, "hardware/tools");
        var teensybin = jsmk.path.join(teensytools, "arm/bin");
        var jtools = jsmk.GetTools("tool/teensy/tools.js");

        var config = {};

        config.BuildVars =
        {
            ARDROOT: ardroot,
            TEENSYSRC: "D:/dana//src/teensy/libs/libcore/teensy-cores/teensy3",
            TEENSYLIBS: jsmk.path.join(ardroot, "hardware/teensy/avr/libraries"),
            TEENSYTOOLS: teensytools,
            // TEENSYBOARD: "TEENSY31",
            TEENSYBOARD: "TEENSYLC",
        };
        config.Environment =
        {
            PATH: teensybin + ';' + teensytools;
        };

        this.MergeSettings(config);

        this.MergeToolMap(
            {
                "cpp->o": jtools.cpp,
                "c->o": jtools.cc,
                "cpp.o->elf": jtools.link,
                "o->a": jtools.ar,
                "elf->eep": jtools.objcopy, // eeprom (data)
                "elf->hex": jtools.objcopy, // non-data
                "postcompile": jtools.postcompile,
            }
        );
    }
}

exports.Toolset = Teensy;
