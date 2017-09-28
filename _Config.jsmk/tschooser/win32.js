/* global jsmk */
// toolset/win32.js:
//      - common windows-specific toolsets
exports.GetToolsets = function()
{
    let vs14 = jsmk.LoadConfig("toolset/vs14.js").Toolset;
    let teensy = jsmk.LoadConfig("toolset/teensy.js").Toolset;
    let esp8266 = jsmk.LoadConfig("toolset/esp8266.js").Toolset;
    var result = [
        new esp8266(),
        new vs14(vs14.Arch.x86_64),
        new teensy(),
    ];
    return result;
};
