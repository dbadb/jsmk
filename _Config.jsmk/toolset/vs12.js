Foundation = require("./foundation.js");

class VS12 extends Foundation
{
    constructor(filename, tsname)
    {
        super.constructor(filename, tsname);

        var vsroot = "C:/Progra~1/Microsoft Visual Studio 12.0";
        var vs12jtools = jsmk.GetTools("tool/windows/vs12.js");

    }

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

exports.VS12 = VS12;
exports.GetToolsets = function()
{
    return VS12(__file, "VS12");
}
