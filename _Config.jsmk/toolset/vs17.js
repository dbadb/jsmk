/*global jsmk */
var Foundation = require("./foundation.js").Foundation;

exports.Toolset = class vs17 extends Foundation
{
    constructor(arch)
    {
        super(__filename, "vs17", arch);

        let root = "C:/Program Files (x86)/";
        let vsDir = root + "Microsoft Visual Studio/2017/Community/";
        let sdkDir = root + "Windows Kits";
        var msvcDir = "VC/Tools/MSVC/14.16.27023";
        var sdkBin = "10/bin/10.0.17763.0";
        let toolsDir, ideDir, sdkToolsDir;
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
        // nb: we wish to support:
        //  gitbash: 
        //      * node is native windows, and accepst c:/ and /mnt/c/
        //  wsl..
        //      * node is linux build, doesn't understand c:/
        //  
        //  In both cases, external programs (like cl.exe) aren't aware
        //  of /mnt.  Basic idea is that we need to differentiate between
        //  paths that node can understand and paths that external programs
        //  understand.
        toolsDir = jsmk.path.join(vsDir, msvcDir, "bin/Hostx64", archVariant);
        ideDir = jsmk.path.join(vsDir, "Common7/IDE", archVariant);
        sdkToolsDir = jsmk.path.join(sdkDir, sdkBin, archVariant);
        var map = {};
        map.BuildVars =
        {
            VSRootDir: vsDir,
            VSSDKDir: sdkDir,
            VSToolsDir: toolsDir,
            VSIDEDir: ideDir,
            VSSDKToolsDir: sdkToolsDir, // eg: rc.exe
        };
        map.EnvMap =
        {
            // these paths obtained via vcvars64.bat
            // via the menu: x64 Native Tools Prompt for VS2017
            x64: {
                INCLUDE: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\VC\\Tools\\MSVC\\14.16.27023\\include;C:\\Program Files (x86)\\Windows Kits\\NETFXSDK\\4.6.1\\include\\um;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17763.0\\ucrt;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17763.0\\shared;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17763.0\\um;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17763.0\\winrt;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17763.0\\cppwinrt",
                LIB: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\VC\\Tools\\MSVC\\14.16.27023\\lib\\x64;C:\\Program Files (x86)\\Windows Kits\\NETFXSDK\\4.6.1\\lib\\um\\x64;C:\\Program Files (x86)\\Windows Kits\\10\\lib\\10.0.17763.0\\ucrt\\x64;C:\\Program Files (x86)\\Windows Kits\\10\\lib\\10.0.17763.0\\um\\x64;",
                LIBPATH: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\VC\\Tools\\MSVC\\14.16.27023\\lib\\x64;C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\VC\\Tools\\MSVC\\14.16.27023\\lib\\x86\\store\\references;C:\\Program Files (x86)\\Windows Kits\\10\\UnionMetadata\\10.0.17763.0;C:\\Program Files (x86)\\Windows Kits\\10\\References\\10.0.17763.0;C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319;",
                WSLENV: "INCLUDE/w:LIB/w:LIBPATH/w",
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

