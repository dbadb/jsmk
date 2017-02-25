//
// toolset/foundation.js:
//      - establishes cross-toolset behavior for a wide range of "rules"
//

Toolset = require("lib/toolset.js");

class Foundation extends Toolset
{
    constructor(filename, tsname)
    {
        super.constructor(filename, tsname);
        this.MergeToolMap( {
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
        } );
    }
};

exports.Foundation = Foundation;
exports.GetToolsets = function()
{
    return Foundation(__file, "Foundation");
}
