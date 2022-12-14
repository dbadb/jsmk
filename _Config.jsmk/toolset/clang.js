const Foundation = require("./foundation.js").Foundation;
const WinConfig = require("./vs22.js").Config;


class Clang extends Foundation
{
    constructor(opts)
    {
        let cfg = Object.assign({}, 
        {
            arch: jsmk.GetHost().Arch,
            vers: "", // toolset version (ie: clang 12.0.0)
        }, opts);
        let arch = cfg.arch;
        console.log("clang arch: " + arch);
        console.log("clang WinConfig " + JSON.stringify(WinConfig));
        let map = {};
        let platform = jsmk.GetHost().Platform;
        if(platform == "darwin")
        {
            let toolChain = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain";
            let devPlatform = "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer";

            // NB: this always gets the latest install:
            // If we want multiple SDKs installed, it's a manual operation and
            // assist is symlinks.
            let sdk = `${devPlatform}/SDKs/MacOSX.sdk`; 
            map.BuildVars = 
            {
                MACOSX_TOOLCHAIN: toolChain,
                MACOSX_SDK: sdk,
                MACOSX_BIN: `${toolChain}/usr/bin`,
                CLANG_BIN: `${toolChain}/usr/bin`,
                MACOSX_INC: `${sdk}/usr/include`,
                MACOSX_LIB: `${sdk}/usr/lib`,
            };
        }
        else
        if(platform == "win32")
        {
            // clang on windows requires stadnard windows setup
            map.BuildVars =  {
                CLANG_BIN: "C:/Program Files/LLVM/bin"
            };
            map.EnvMap = {
                INCLUDE: WinConfig[arch].INCLUDE,
                LIB: WinConfig[arch].LIB,
            };
        }
        else
            throw new Exception("unknown platform " + platform);
        super(__filename, "clang"+cfg.vers, cfg.arch);
        
        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/clang/cc.js");
        let link = jsmk.LoadConfig("tool/clang/link.js");
        let misc = jsmk.LoadConfig("tool/clang/misc.js");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this),
                "c->o": new cc.CC(this),
                "cpp.o->exe": new link.Link(this),
                "cpp.o->so": new link.Link(this, true),
                "o->a": new misc.AR(this),
            }
        );
        if(platform == "darwin")
        {
            this.MergeToolMap(
            {
                "mm->o": new cc.MM(this),
                "y->c": new misc.YACC(this),
                "lex->c": new misc.LEX(this),
            });
        }
        jsmk.DEBUG("clang toolset loaded");
    }
}

exports.Toolset = Clang;
