/* global jsmk */
var Foundation = require("./foundation.js").Foundation;

class Teensy extends Foundation
{
    // arch is set by tschooser.
    // arch may include '_'-separated 'fields' to produce build variants.
    // used eg to select CPUFREQ since the entire core needs to agree on clockspeed
    constructor(arch="teensyLC", ardroot="${HOME}/Documents/arduino-1.8.12")
    {
        super(__filename, "teensy", arch, "arduino");
        ardroot = jsmk.Interpolate(ardroot);
        let ardlibs = jsmk.path.join(ardroot, "../Arduino/libraries");
        let t3src = jsmk.path.join(ardroot, "hardware/teensy/avr/cores/teensy3");
        let t4src = jsmk.path.join(ardroot, "hardware/teensy/avr/cores/teensy4");
        let teensytools = jsmk.path.join(ardroot, "hardware/tools");
        let teensybin = jsmk.path.join(teensytools, "arm/bin");
        let map = {};

        let archfields = arch.split("_");
        let archbase = archfields[0]; // teens40_oc
        let teensycore = 
        {
            "teensy41": t4src,
            "teensy40": t4src,
            "teensy31": t3src,
            "teensyLC": t3src,
        }[archbase];

        map.BuildVars =
        {
            ARDUINO: "10812",
            TEENSYDUINO: "153",
            ARDROOT: ardroot,
            ARDLIBS: ardlibs,
            TEENSYLIBS: jsmk.path.join(ardroot, "hardware/teensy/avr/libraries"),
            TEENSYTOOLS: teensytools,
            // TEENSYBOARD: "TEENSY31",
            TEENSYBOARD: 
            {
                "teensy41": "TEENSY41",
                "teensy40": "TEENSY40",
                "teensy31": "TEENSY31",
                "teensyLC": "TEENSYLC",
            }[archbase],
            TEENSYSRC: teensycore,
            TEENSYCORE: teensycore,
            TEENSYPATH: [teensybin, teensytools],
            TEENSYVARIANTS: archfields.slice(1), // often []
            OPTIMIZATION:  // a build-var to be consumed by tools
            {
                "teensy41": "Mixed", // "-O2"
                "teensy40": "Mixed", // "-O2"
                "teensy31": "Size", // "-Os" ??
                "teensyLC": "Size", // "-Os"
            }[archbase],
        };

        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/teensy/cc.js");
        let link = jsmk.LoadConfig("tool/teensy/link.js");
        let misc = jsmk.LoadConfig("tool/teensy/misc.js");

        this.MergeToolMap(
            {
                "S->o": new cc.SC(this),
                "c->o": new cc.CC(this),
                "cpp->o": new cc.CPP(this),
                "cpp.o->elf": new link.Link(this),
                "o->a": new misc.AR(this),
                "elf->eep": new misc.ObjCopy(this, "elf->eep"), // eeprom (data)
                "elf->hex": new misc.ObjCopy(this, "elf->hex"), // non-data
                "report": new misc.ReportSize(this),
                "postcompile": new misc.PostCompile(this)
            }
        );
        jsmk.DEBUG("Teensy toolset loaded");
    } // end constructor
}

exports.Toolset = Teensy;
