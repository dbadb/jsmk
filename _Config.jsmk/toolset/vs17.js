/*global jsmk */
var Foundation = require("./foundation.js").Foundation;

exports.Toolset = class vs17 extends Foundation
{
    constructor(arch)
    {
        super(__filename, "vs17", arch);

        let vsDir = "C:/Progra~2/Microsoft Visual Studio/2017/Community";
        let sdkDir = "C:/Progra~2/Windows Kits";
        var msvcDir = "VC/Tools/MSVC/14.14.26428";
        var sdkInc = "10/include/10.0.17134.0";
        var sdkLib = "10/lib/10.0.17134.0";
        var sdkBin = "10/bin";
        let toolsDir, ideDir;
        let archVariant;

        if(arch === Foundation.Arch.x86_64)
        {
            archVariant = "x64"; // for sdk
        }
        else
        {
            archVariant = "x86"; // for sdk
        }
        // add'l archVariant: arm64, arm
        toolsDir = jsmk.path.join(vsDir, msvcDir, "bin/Hostx64", archVariant);
        ideDir = jsmk.path.join(vsDir, "Common7/IDE", archVariant);
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
             INCLUDE
                ${vsdir}\VC\Tools\MSVC\14.14.26428\ATLMFC\include;
                ${vsdir}\VC\Tools\MSVC\14.14.26428\include;
                ${sdkDir}\NETFXSDK\4.6.1\include\um;
                ${sdkDir}\10\include\10.0.17134.0\ucrt;
                ${sdkDir}\10\include\10.0.17134.0\shared;
                ${sdkDir}\10\include\10.0.17134.0\um;
                ${sdkDir}\10\include\10.0.17134.0\winrt;
                ${sdkDir}\10\include\10.0.17134.0\cppwinrt
             LIB
                ${vsdir}\VC\Tools\MSVC\14.14.26428\ATLMFC\lib\x64;
                ${vsdir}\VC\Tools\MSVC\14.14.26428\lib\x64;
                ${sdkDir}\NETFXSDK\4.6.1\lib\um\x64;
                ${sdkDir}\10\lib\10.0.17134.0\ucrt\x64;
                ${sdkDir}\10\lib\10.0.17134.0\um\x64;
             LIBPATH
                ${vsdir}\VC\Tools\MSVC\14.14.26428\ATLMFC\lib\x64;
                ${vsdir}\VC\Tools\MSVC\14.14.26428\lib\x64;
                ${vsdir}\VC\Tools\MSVC\14.14.26428\lib\x86\store\references;
                ${sdkDir}\10\UnionMetadata\10.0.17134.0;
                ${sdkDir}\10\References\10.0.17134.0;
                C:\WINDOWS\Microsoft.NET\Framework64\v4.0.30319;
             */
            INCLUDE: [
                jsmk.path.join(vsDir, msvcDir, "/ATLMFC/include"),
                jsmk.path.join(vsDir, msvcDir, "include"),
                jsmk.path.join(sdkDir, "NETFXSDK/4.6.1/include/um"),
                jsmk.path.join(sdkDir, sdkInc, "ucrt"),
                jsmk.path.join(sdkDir, sdkInc, "shared"),
                jsmk.path.join(sdkDir, sdkInc, "um"),
                jsmk.path.join(sdkDir, sdkInc, "winrt"),
                jsmk.path.join(sdkDir, sdkInc, "cppwinrt"),
            ].join(";"),

            LIB: [
                jsmk.path.join(vsDir, msvcDir, "ATLMFC/lib", archVariant),
                jsmk.path.join(vsDir, msvcDir, "lib", archVariant),
                jsmk.path.join(sdkDir, "NETFXSDK/4.6.1/lib/um", archVariant),
                jsmk.path.join(sdkDir, sdkLib, "ucrt", archVariant),
                jsmk.path.join(sdkDir, sdkLib, "um", archVariant),
            ].join(";"),

            LIBPATH: [
                jsmk.path.join(vsDir, msvcDir, "ATLMFC/lib/", archVariant),
                jsmk.path.join(vsDir, msvcDir, "lib", archVariant),
                jsmk.path.join(vsDir, msvcDir, "lib/x86/store/references"),
                jsmk.path.join(sdkDir, "10/UnionMetadata/10.0.17134.0"),
                jsmk.path.join(sdkDir, "10/References/10.0.17134.0"),
                "C:/Windows/Microsoft.NET/Framework64/v4.0.30319",
            ],

            PATH: [
                // linker needs to find rc.exe
                jsmk.path.join(sdkDir, sdkBin, archVariant),
            ],
        };

        this.MergeSettings(map);

        let vers = "17";
        let dir = "tool/windows/vs/";
        this.MergeToolMap({
            "c->o":    new (jsmk.LoadConfig(dir+"cc.js").CC)(this, vers),
            "cpp->o":  new (jsmk.LoadConfig(dir+"cc.js").CPP)(this, vers),
            "o->a":    new (jsmk.LoadConfig(dir+"ar.js").AR)(this, vers),
            "c.o->exe":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers),
            "cpp.o->exe":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers),
            //"link":     jsmk.LoadConfig("tools/windows/vs12/link.js").Tool(this),
        });

        jsmk.DEBUG(this.ToolsetHandle + " toolset loaded");
    }
};

