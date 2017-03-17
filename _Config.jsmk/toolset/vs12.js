var Foundation = require("./foundation.js").Foundation;

class vs12 extends Foundation
{
    constructor(arch)
    {
        super(__filename, "vs12_"+arch);

        var vsroot = "C:/Progra~1/Microsoft Visual Studio 12.0";

        var map = {};
        map.BuildVars =
        {
            VSROOT: vsroot,
            VS_SDK: jsmk.path.join(vsroot, "Windows_Kits/8.1"),
        };
        map.EnvMap = {};

        switch(arch)
        {
        case "x86":
            map.EnvMap.PATH = jsmk.path.join(vsroot, "VC/bin/amd64") + ';' +
                                  jsmk.path.join(vsroot, "Common7/IDE/amd64");
            break;
        case "x86_64":
            map.EnvMap.PATH = jsmk.path.join(vsroot, "VC/bin") + ';' +
                                   jsmk.path.join(vsroot, "Common7/IDE");
            break;
        default:
            throw new Error("Unimplemented arch for vs12 toolset");
        }
        this.MergeSettings(map);

        this.MergeToolMap({
            "c->o":     new (jsmk.LoadConfig("tool/windows/vs12/cc.js").Tool)(this),
            //"c->a":     jsmk.LoadConfig("tools/windows/vs12/ar.js").Tool(this),
            //"c.o->exe": jsmk.LoadConfig("tools/windows/vs12/link.js").Tool(this),
            //"cpp->o":   jsmk.LoadConfig("tools/windows/vs12/cpp.js").Tool(this),
            //"cpp->a":   jsmk.LoadConfig("tools/windows/vs12/ar.js").Tool(this),
            //"cpp.o->exe": jsmk.LoadConfig("tools/windows/vs12/link.js").Tool(this),
            //"link":     jsmk.LoadConfig("tools/windows/vs12/link.js").Tool(this),
        });
    }
}

exports.Toolset = vs12;
