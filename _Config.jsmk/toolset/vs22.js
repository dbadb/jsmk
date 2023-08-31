/*global jsmk */
//  See also clang backed by a vs22 install.  
//  Currently (12/22) the Visual Studio IDE crashes on urchin, 
//  but the vc17 debugger works with vc22 builds.
//  Considerations on the choice of a compiler for win32 apps:
//   - all compilers need access to windows APIs which are installed
//     during VisualStudio install.
//   - clang may produce better code but this isn't verified.
//     It also still has outstanding known issues.  That said
//     chuck compiles and runs fine.
//   - after evaluating clang we came back to vs22 since it's the
//     "closest to the source".
var Foundation = require("./foundation.js").Foundation;

const sdkVers = "10.0.22000.0";
const vcVers = "14.37.32822"; // "14.36.32532"; // "14.35.32215";
const vsDir = "C:/Program Files/Microsoft Visual Studio/2022/Community/";
const sdkRoot = "C:/Program Files (x86)/Windows Kits";
const msvcDir = `${vsDir}/VC/Tools/MSVC/${vcVers}`;

const Config = {};
Config[Foundation.Arch.x86_64] = getConfig("x64");
Config[Foundation.Arch.x86_32] = getConfig("x32");
Config.x64 = getConfig("x64"); // toolset.Arch more precise than Host.Arch
Config.x32 = getConfig("x32");

function getConfig(arch)
{
    let c = {
        msvcLibDir : `${msvcDir}/Lib/${arch}`, // delayimp.lib
        msvcIncDir : `${msvcDir}/include`, // std library headers
        sdkBinDir : `${sdkRoot}/10/bin/${sdkVers}/${arch}`,
        sdkIncUmDir : `${sdkRoot}/10/Include/${sdkVers}/um`, // windows.h
        sdkIncSharedDir : `${sdkRoot}/10/Include/${sdkVers}/shared`, // winapifamily.h
        sdkIncCrtDir : `${sdkRoot}/10/Include/${sdkVers}/ucrt`,
        sdkLibUmDir : `${sdkRoot}/10/Lib/${sdkVers}/um/${arch}`, // dsound.lib
        sdkLibCrtDir : `${sdkRoot}/10/Lib/${sdkVers}/ucrt/${arch}`,
    }
    // toolsDir is where cl, link, lib, etc are (including llvm fwiw)
    // here x64 refers to build-host
    c.toolsDir = jsmk.path.join(msvcDir, "bin/Hostx64", arch);
    // ideDir is places where IDE runtimes (dll are found 
    // (offref, VsRegistryDetour) (usefulness ?)
    c.ideDir = jsmk.path.join(vsDir, "Common7/IDE", arch);
    c.INCLUDE = `${c.msvcIncDir};${c.sdkIncUmDir};${c.sdkIncSharedDir};${c.sdkIncCrtDir};`;
    c.LIB = `${c.msvcLibDir};${c.sdkLibUmDir};${c.sdkLibCrtDir}`;
    c.BuildVars = {
        VSRootDir: vsDir,
        VSSDKDir: sdkRoot, // unused ?
        VSToolsDir: c.toolsDir,
        VSIDEDir: c.ideDir,
        VSSDKToolsDir: c.sdkBinDir, // eg: rc.exe
    }
    return c;
}

exports.Config = Config;

exports.Toolset = class vs22 extends Foundation
{
    constructor(arch)
    {
        super(__filename, "vs22", arch);

        // sdkToolsDir is location for, eg rc.exe and other tools
        var map = {};
        map.BuildVars = Config[arch].BuildVars;
        /*
        {
            VSRootDir: vsDir,
            VSSDKDir: sdkRoot, // unused ?
            VSToolsDir: Config[arch].toolsDir,
            VSIDEDir: Config[arch].ideDir,
            VSSDKToolsDir: Config[arch].sdkBinDir, // eg: rc.exe
        };
        */
        map.EnvMap =
        {
            INCLUDE: Config[arch].INCLUDE,
            LIB: Config[arch].LIB,
            // XXX: add 32bit
        };

        this.MergeSettings(map);

        let vers = "22";
        let dir = "tool/windows/vs/";
        let ccmod = jsmk.LoadConfig(dir+"cc.js");
        let CC = new ccmod.CC(this, vers);
        let CPP = new ccmod.CPP(this, vers);
        let Link = jsmk.LoadConfig(dir+"link.js").Link;
        let dlltool = new Link(this, vers, true);
        let rescmp = new (jsmk.LoadConfig(dir+"rc.js").RC)(this, vers);
        let AR = new (jsmk.LoadConfig(dir+"ar.js").AR)(this, vers);
        this.MergeToolMap({
            "c->o":    CC,
            "cpp->o":  CPP,
            "o->a":    AR,
            "o->so": dlltool,
            "o->dll": dlltool,
            "c.o->exe": new Link(this, vers),
            "cpp.o->exe": new Link(this, vers),
            "cpp.o->so": dlltool,
            "cpp.o->dll": dlltool,
            "rc->o": rescmp,
        });

        jsmk.DEBUG(this.ToolsetHandle + " toolset loaded");
    }
};

