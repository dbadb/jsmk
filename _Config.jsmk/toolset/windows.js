//
// toolset/windows.js:
//      - common windows-specific toolsets
var foundation = require("./foundation.js").foundation;

var vsroot = "C:/Progra~1/Microsoft Visual Studio 12.0";
var vs12jtools = jsmk.GetTools("tool/windows/vs12.js");
var vs12: {
    name: "vs12",
    buildsettings: {
        VSROOT: vsroot,
        VS_SDK: jsmk.path.join(vsroot, "Windows_Kits/8.1"),
    },
    environment_x64: {
        PATH: jsmk.path.join(vsroot, "VC/bin/amd64") + ';' + 
              jsmk.path.join(vsroot, "Common7/IDE/amd64");
    },
    environment_x86: {
        PATH: jsmk.path.join(vsroot, "VC/bin") + ';' + 
              jsmk.path.join(vsroot, "Common7/IDE");
    }
    tools: {
        __proto__: foundation.tools,

        // for cpp dev (platform+toolset specific)
        "c->o":     jsmk.GetConfig("tool/windows/vs12cc.js"),
        "c->a":     jsmk.GetConfig("tools/windows/vs12ar.js"),
        "c.o->exe": jsmk.GetConfig("tools/windows/vs12link.js"),
        "cpp->o":   jsmk.GetConfig("tools/windows/vs12cpp.js"),
        "cpp->a":   jsmk.GetConfig("tools/windows/vs12ar.js"),
        "cpp.o->exe": jsmk.GetConfig("tools/windows/vs12link.js"),
        "link":     jsmk.GetConfig("tools/windows/vs12link.js"),
    },
};

var ardroot = "C:Proga~2/Arduino";
var teensytools = jsmk.path.join(ardroot, "hardware/tools"); 
var teensybin = jsmk.path.join(teensytools, "arm/bin");
var jtools = jsmk.GetTools("tool/teensy/tools.js");
var teensy: {
    buildsettings: {
        ARDROOT: ardroot,
        TEENSYSRC: "D:/dana//src/teensy/libs/libcore/teensy-cores/teensy3",
        TEENSYLIBS: jsmk.path.join(ardroot, "hardware/teensy/avr/libraries"),
        TEENSYTOOLS: teensytools,
        TEENSYBOARD: "TEENSY31",
    },
    environment: {
        PATH: teensybin + ';' + teensytools;
    },
    tools: {
        "cpp->o": jtools.cpp,
        "c->o": jtools.cc,
        "cpp.o->elf": jtools.link,
        "o->a": jtools.ar,
        "elf->eep": jtools.objcopy, // eeprom (data)
        "elf->hex": jtools.objcopy, // non-data
        "postcompile": jtools.postcompile, 
    }
}

var teensyLC: {
    __proto__ :  teensy,
    buildsettings: {
        __proto__: tensys.buildsettings,
        TEENSYBOARD: "TEENSYLC",
    }
}

exports.Toolsets = {
    vs12,
    teensy
};

