//
// toolset/foundation.js:
//      - establishes cross-toolset behavior

Toolset = require("Toolset.js");

exports.Foundation = Foundation;


class Foundation extends Toolset
{
    constructor()
    {
        super.constructor();
        this.Name = "foundation",
        this.Tools =  {
            copy:       "jsmk:copy -stage build",
            install:    "jsmk:copy -stage install",

            // for cpp dev (platform+toolset specific)
            "c->o":     undefined,
            "c->a":     undefined,
            "c.o->exe": undefined,
            "cpp->o":   undefined,
            "cpp->a":   undefined,
            "cpp.o->exe": undefined,
            "link":     undefined,

            // shader development
            "osl->oso": undefined, // "oslcompiler"
            "sl->slo": undefined   // "rslcompiler"
        }
    }
};
