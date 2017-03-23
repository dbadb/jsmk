//
// toolset/foundation.js:
//      - establishes cross-toolset behavior for a wide range of "rules"
//      - since we're not a concrete toolset, we don't export GetToolsets
//

var Toolset = jsmk.Require("toolset.js").Toolset;

class Foundation extends Toolset
{
    constructor(filename, tsname, arch)
    {
        super(filename, tsname, arch);

        // no settings in foundation?

        this.MergeToolMap( {
            copy:       "jsmk/copy -stage build",
            install:    "jsmk/copy -stage install",

            // for javascript development -------------------
            ".js->.js.min": "jsmk/minify", // aka uglify

            // for Android ----------------------------------

            // for iPhone -----------------------------------

            // for cpp dev (platform+toolset specific) ------
            "c->o":     undefined,
            "c->a":     undefined,
            "c.o->exe": undefined,
            "cpp->o":   undefined,
            "cpp->a":   undefined,
            "cpp.o->exe": undefined,
            "link":     undefined,

            // shader development ---------------------------
            "osl->oso": undefined, // "oslcompiler"
            "sl->slo": undefined   // "rslcompiler"
        } );
    }
};

exports.Foundation = Foundation;
