/* global jsmk */
// toolset/wls.js:
//   - common wls windows-specific toolsets
exports.GetToolsets = function()
{
    //let gcc = jsmk.LoadConfig("toolset/gccwin32.js").Toolset;
    let vs17 = jsmk.LoadConfig("toolset/vs17.js").Toolset;
    var result = [
        new vs17(vs17.Arch.x86_64),
    ];
    return result;
};
