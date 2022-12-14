/*global jsmk */
// NB: this is a work-in-progress. Tabled in favor of clang
//   backed by a vs22 install.  Currently (12/22) the Visual 
//   Studio IDE crashes on urchin. (!!)
var Foundation = require("./foundation.js").Foundation;

exports.Toolset = class vs22 extends Foundation
{
    constructor(arch)
    {
        super(__filename, "vs22", arch);

        let sdkVers = "10.0.22000.0";
        let vcVers = "14.34.31933";
        let vsDir = "C:/Program Files/Microsoft Visual Studio/2022/Community/";
        let sdkRoot = "C:/Program Files (x86)/Windows Kits";

        let archVariant = (arch === Foundation.Arch.x86_64) ? "x64" : "x32"; // XXX arm64, ...
        var msvcDir = `${vsDir}/VC/Tools/MSVC/${vcVers}`;
        var msvcLibDir = `${msvcDir}/Lib/${archVariant}`; // delayimp.lib
        var msvcIncDir = `${msvcDir}/include`; // std library headers
        var sdkBinDir = `${sdkRoot}/10/bin/${sdkVers}/${archVariant}`;
        var sdkIncUmDir = `${sdkRoot}/10/Include/${sdkVers}/um`; // windows.h
        var sdkIncSharedDir = `${sdkRoot}/10/Include/${sdkVers}/shared`; // winapifamily.h
        var sdkIncCrtDir = `${sdkRoot}/10/Include/${sdkVers}/ucrt`;
        var sdkLibUmDir = `${sdkRoot}/10/Lib/${sdkVers}/um/${archVariant}`; // dsound.lib
        var sdkLibCrtDir = `${sdkRoot}/10/Lib/${sdkVers}/ucrt/${archVariant}`;

        // add'l archVariant: arm64, arm
        // nb: we wish to support:
        //  gitbash: 
        //      * node is native windows, and accepts c:/ and /mnt/c/
        //  wsl..
        //      * node is linux build, doesn't understand c:/
        //  
        //  In both cases, external programs (like cl.exe) aren't aware
        //  of /mnt.  Basic idea is that we need to differentiate between
        //  paths that node can understand and paths that external programs
        //  understand.

        // toolsDir is where cl, link, lib, etc are (including llvm fwiw)
        let toolsDir = jsmk.path.join(msvcDir, "bin/Hostx64", archVariant);
        // ideDir is places where IDE runtimes (dll are found 
        // (offref, VsRegistryDetour) (usefulness ?)
        let ideDir = jsmk.path.join(vsDir, "Common7/IDE", archVariant);
        // sdkToolsDir is location for, eg rc.exe and other tools
        var map = {};
        map.BuildVars =
        {
            VSRootDir: vsDir,
            VSSDKDir: sdkRoot, // unused ?
            VSToolsDir: toolsDir,
            VSIDEDir: ideDir,
            VSSDKToolsDir: sdkBinDir, // eg: rc.exe
        };
        map.EnvMap =
        {
            // these paths obtained via vcvars64.bat
            // via the menu: x64 Native Tools Prompt for VS2017
            x64: {
                INCLUDE: `${msvcIncDir};${sdkIncUmDir};${sdkIncSharedDir};${sdkIncCrtDir};`,
                LIB: `${msvcLibDir};${sdkLibUmDir};${sdkLibCrtDir}`,
                //LIB: "\14.16.27023\\lib\\x64;C:\\Program Files (x86)\\Windows Kits\\NETFXSDK\\4.6.1\\lib\\um\\x64;C:\\Program Files (x86)\\Windows Kits\\10\\lib\\10.0.17763.0\\ucrt\\x64;C:\\Program Files (x86)\\Windows Kits\\10\\lib\\10.0.17763.0\\um\\x64;",
                //LIBPATH: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\VC\\Tools\\MSVC\\14.16.27023\\lib\\x64;C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\VC\\Tools\\MSVC\\14.16.27023\\lib\\x86\\store\\references;C:\\Program Files (x86)\\Windows Kits\\10\\UnionMetadata\\10.0.17763.0;C:\\Program Files (x86)\\Windows Kits\\10\\References\\10.0.17763.0;C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319;",
                //WSLENV: "INCLUDE/w:LIB/w:LIBPATH/w",
                // https://blogs.msdn.microsoft.com/commandline/2017/12/22/share-environment-vars-between-wsl-and-windows/
            },
            // XXX: add 32bit
        }[archVariant];

        this.MergeSettings(map);

        let vers = "17";
        let dir = "tool/windows/vs/";
        let ccmod = jsmk.LoadConfig(dir+"cc.js");
        let CC = new ccmod.CC(this, vers);
        let CPP = new ccmod.CPP(this, vers);
        let Link = jsmk.LoadConfig(dir+"link.js").Link;
        let dlltool = new Link(this, vers, true);
        this.MergeToolMap({
            "c->o":    CC,
            "cpp->o":  CPP,
            "o->a":    new (jsmk.LoadConfig(dir+"ar.js").AR)(this, vers),
            "o->so": dlltool,
            "o->dll": dlltool,
            "c.o->exe": new Link(this, vers),
            "cpp.o->exe": new Link(this, vers),
            "cpp.o->so": dlltool,
            "cpp.o->dll": dlltool,
            "rc->o": new (jsmk.LoadConfig(dir+"rc.js").RC)(this, vers),
        });

        jsmk.DEBUG(this.ToolsetHandle + " toolset loaded");
    }
};

