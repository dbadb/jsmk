var Foundation = require("./foundation.js").Foundation;

class vs14 extends Foundation
{
    constructor(arch)
    {
        super(__filename, "vs14", arch);

        let vsDir = "C:/Progra~2/Microsoft Visual Studio 14.0";
        // currently, suffering from win10 link errors looking for kernel32.lib
        let sdkDir = "C:/Progra~2/Windows Kits";
        //let sdkDir = "C:/Progra~2/Windows Kits/8.1";
        //let sdkSubdir = "winv6.3";

        let toolsDir, ideDir;
        let archVariant1, archVariant2;

        if(arch === Foundation.Arch.x86_64)
        {
            toolsDir = jsmk.path.join(vsDir, "VC/bin/amd64");
            ideDir = jsmk.path.join(vsDir, "Common7/IDE/amd64");
            archVariant1 = "x64"; // for sdk
            archVariant2 = "amd64"; // for msv
        }
        else
        {
            toolsDir = jsmk.path.join(vsDir, "VC/bin");
            ideDir = jsmk.path.join(vsDir,"Common7/IDE");
            archVariant1 = "x86"; // for sdk
            archVariant2 = ""; // for msv
        }
        // add'l archVariant: arm64, arm

        var map = {};
        map.BuildVars =
        {
            VSRootDir: vsDir,
            VSSDKDir: sdkDir,
            VSToolsDir: toolsDir,
            VSIDEDir: ideDir,
        };
        map.EnvMap =
        {
            // these paths obtained via vcvars64.bat
            /*
             INCLUDE=C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\INCLUDE;
                C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\ATLMFC\INCLUDE;
                C:\Program Files (x86)\Windows Kits\10\include\10.0.10240.0\ucrt;
                C:\Program Files (x86)\Windows Kits\NETFXSDK\4.6.1\include\um;
                C:\Program Files (x86)\Windows Kits\8.1\include\\shared;
                C:\Program Files (x86)\Windows Kits\8.1\include\\um;
                C:\Program Files (x86)\Windows Kits\8.1\include\\winrt;
             LIB=C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\LIB\amd64;
                C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\ATLMFC\LIB\amd64;
                C:\Program Files (x86)\Windows Kits\10\lib\10.0.10240.0\ucrt\x64;
                C:\Program Files (x86)\Windows Kits\NETFXSDK\4.6.1\lib\um\x64;
                C:\Program Files (x86)\Windows Kits\8.1\lib\winv6.3\um\x64;
             LIBPATH=C:\WINDOWS\Microsoft.NET\Framework64\v4.0.30319;
                C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\LIB\amd64;
                C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\ATLMFC\LIB\amd64;
                C:\Program Files (x86)\Windows Kits\8.1\References\CommonConfiguration\Neutral;
                C:\Program Files (x86)\Microsoft SDKs\Windows Kits\10\ExtensionSDKs\Microsoft.VCLibs\14.0\References\CommonConfiguration\neutral;
             */
            INCLUDE: [
                jsmk.path.join(vsDir, "VC/include/"),
                jsmk.path.join(vsDir, "VC/ATLMFC/include/"),
                jsmk.path.join(sdkDir, "10/include/10.0.10240.0/ucrt"),
                jsmk.path.join(sdkDir, "NETFXSDK/4.6.1/include/um"),
                jsmk.path.join(sdkDir, "8.1/include/shared"),
                jsmk.path.join(sdkDir, "8.1/include/um"),
                jsmk.path.join(sdkDir, "8.1/include/winrt"),
            ].join(";"),

            LIB: [
                jsmk.path.join(vsDir, "VC/lib", archVariant2),
                jsmk.path.join(vsDir, "VC/ATLMFC/lib", archVariant2),
                jsmk.path.join(sdkDir, "10/Lib/10.0.10240.0/ucrt", archVariant1),
                jsmk.path.join(sdkDir, "NETFXSDK/4.6.1/lib/um", archVariant1),
                jsmk.path.join(sdkDir, "8.1/lib/winv6.3/um", archVariant1),
            ].join(";"),

            LIBPATH: [
                "C:/Windows/Microsoft.NET/Framework64/v4.0.30319",
                jsmk.path.join(vsDir, "VC/LIB/", archVariant2),
                jsmk.path.join(vsDir, "VC/ATLMFC/LIB", archVariant2),
                jsmk.path.join(sdkDir, "8.1/References/CommonConfiguration/Neutral"),
                jsmk.path.join(sdkDir, "10/ExtensionSDKs/Microsoft.VCLibs/14.0/References/CommonConfiguration/neutral"),
            ]
        };

        this.MergeSettings(map);

        let vers = "14";
        let dir = "tool/windows/vs/";
        this.MergeToolMap({
            "c->o":    new (jsmk.LoadConfig(dir+"cc.js").CC)(this, vers),
            "cpp->o":  new (jsmk.LoadConfig(dir+"cc.js").CPP)(this, vers),
            "o->a":    new (jsmk.LoadConfig(dir+"ar.js").AR)(this, vers),
            "c.o->exe":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers),
            "cpp.o->exe":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers),
            //"link":     jsmk.LoadConfig("tools/windows/vs12/link.js").Tool(this),
        });

        jsmk.DEBUG(this.GetName() + " toolset loaded");
    }
}

exports.Toolset = vs14;
