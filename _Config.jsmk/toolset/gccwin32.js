/* global jsmk */
var gcc = require("./gcc.js").Toolset;
class gccwin32 extends gcc
{
     constructor(opts)
     {
        super(opts);
        this.MergeSettings(map);
        jsmk.DEBUG("gccwin32 toolset loaded");
    } // end constructor
}

exports.Toolset = gccwin32;
