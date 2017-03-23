//
// toolset/win32.js:
//      - common windows-specific toolsets
exports.GetToolsets = function()
{
    let vs14 = jsmk.LoadConfig("toolset/vs14.js").Toolset;
    let teensy = jsmk.LoadConfig("toolset/teensy.js").Toolset;
    var result = [
        new vs14(vs14.Arch.x86_64),
        new teensy(),
    ];
    return result;
}
