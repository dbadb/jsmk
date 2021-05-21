const Foundation = require("./foundation.js").Foundation;

class Clang extends Foundation
{
    constructor(opts)
    {
        let cfg = Object.assign({}, 
        {
            arch: jsmk.GetHost().Arch,
            vers: "", // toolset version (ie: clang 12.0.0)
        }, opts);
        let toolChain = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain";
        let devPlatform = "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer";
        let sdk = `${devPlatform}/SDKs/MacOSX11.3.sdk`;

        let map = {};
        map.BuildVars =
        {
            MACOSX_TOOLCHAIN: toolChain,
            MACOSX_SDK: sdk,
            MACOSX_BIN: `${toolChain}/usr/bin`,
            MACOSX_INC: `${sdk}/usr/include`,
            MACOSX_LIB: `${sdk}/usr/lib`,
        };
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
                "y->c": new misc.YACC(this),
                "lex->c": new misc.LEX(this),
                "cpp.o->so": new link.Link(this, true),
                "o->a": new misc.AR(this),
            }
        );
        jsmk.DEBUG("osx/clang toolset loaded");
    }
}

exports.Toolset = Clang;
