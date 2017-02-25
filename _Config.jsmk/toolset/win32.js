//
// toolset/windows.js:
//      - common windows-specific toolsets
var vs15 = require("./vs15.js");
var teensy = require("./teensy.js");

exports.GetToolsets = function()
{
    var result = [];
    for (let ts of [vs15, teensy])
    {
        result.concat(ts.GetToolsets());
    }
    return result;
}
