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
        var msvcDir = "VC/Tools/MSVC/14.14.26428";
        var sdkInc = "10/Include/10.0.17134.0";
        var sdkLib = "10/Lib/10.0.17134.0";
        var sdkBin = "10/bin";
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
			INCLUDE: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\ATLMFC\\include;C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\include;C:\\Program Files (x86)\\Windows Kits\\NETFXSDK\\4.6.1\\include\\um;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17134.0\\ucrt;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17134.0\\shared;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17134.0\\um;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17134.0\\winrt;C:\\Program Files (x86)\\Windows Kits\\10\\include\\10.0.17134.0\\cppwinrt",
			
			LIB: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\ATLMFC\\lib\\x64;C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\lib\\x64;C:\\Program Files (x86)\\Windows Kits\\NETFXSDK\\4.6.1\\lib\\um\\x64;C:\\Program Files (x86)\\Windows Kits\\10\\lib\\10.0.17134.0\\ucrt\\x64;C:\\Program Files (x86)\\Windows Kits\\10\\lib\\10.0.17134.0\\um\\x64;", 

			LIBPATH: "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\ATLMFC\\lib\\x64;C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\lib\\x64;C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Tools\\MSVC\\14.14.26428\\lib\\x86\\store\\references;C:\\Program Files (x86)\\Windows Kits\\10\\UnionMetadata\\10.0.17134.0;C:\\Program Files (x86)\\Windows Kits\\10\\References\\10.0.17134.0;C:\\WINDOWS\\Microsoft.NET\\Framework64\\v4.0.30319;",

// https://blogs.msdn.microsoft.com/commandline/2017/12/22/share-environment-vars-between-wsl-and-windows/
            WSLENV: "INCLUDE/w:LIB/w:LIBPATH/w",

        };

        this.MergeSettings(map);

        let vers = "17";
        let dir = "tool/windows/vs/";
        this.MergeToolMap({
            "c->o":    new (jsmk.LoadConfig(dir+"cc.js").CC)(this, vers),
            "cpp->o":  new (jsmk.LoadConfig(dir+"cc.js").CPP)(this, vers),
            "o->a":    new (jsmk.LoadConfig(dir+"ar.js").AR)(this, vers),
            "o->so":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers, true),
            "c.o->exe":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers),
            "cpp.o->exe":new (jsmk.LoadConfig(dir+"link.js").Link)(this, vers),
            "rc->o": new (jsmk.LoadConfig(dir+"rc.js").RC)(this, vers),
        });

        jsmk.DEBUG(this.ToolsetHandle + " toolset loaded");
    }
};

