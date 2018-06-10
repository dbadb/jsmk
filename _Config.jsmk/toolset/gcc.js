/* global jsmk */
var Foundation = require("./foundation.js").Foundation;

class GCC extends Foundation
{
     constructor(opts)
     {
        if(!opts)
            opts = {};
        if(!opts.arch)
            opts.arch = jsmk.GetHost().Arch;
        if(!opts.vers)
            opts.vers = "";

        super(__filename, "gcc"+opts.vers, opts.arch);

        let map = {};
        map.BuildVars = {
            LINUX_TOOLCHAIN: "/usr/bin"
        };
        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/gcc/cc.js");
        let link = jsmk.LoadConfig("tool/gcc/link.js");
        let misc = jsmk.LoadConfig("tool/gcc/misc.js");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this),
                "c->o": new cc.CC(this),
                "cpp.o->exe": new link.Link(this),
                "o->a": new misc.AR(this),
            }
        );
        jsmk.DEBUG("linux toolset loaded");
    } // end constructor
}

exports.Toolset = GCC;
