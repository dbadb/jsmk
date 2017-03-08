//
// toolset/win32.js:
//      - common windows-specific toolsets
exports.GetToolsets = function()
{
    let vs12 = jsmk.LoadConfig("toolset/vs12.js").Toolset;
    // let teensy = jsmk.LoadConfig("toolset/teensy.js").Toolset;
    var result = [
        new vs12("x86_64"),
        new vs12("x86"),
        // new teensy(),
    ];
    return result;
}
