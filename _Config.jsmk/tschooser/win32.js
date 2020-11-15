/* global jsmk */
// toolset/win32.js:
//      - common windows-specific toolsets
exports.GetToolsets = function()
{
    let teensy = jsmk.LoadConfig("toolset/teensy.js").Toolset;
    // let esp8266 = jsmk.LoadConfig("toolset/esp8266.js").Toolset;
    let vs17 = jsmk.LoadConfig("toolset/vs17.js").Toolset;
    let esp8266 = jsmk.LoadConfig("toolset/esp8266.js").Toolset;

    var result = [
        new teensy(),
        new esp8266("robodyn"),
        new esp8266("d1_mini"),
        new esp8266("generic"),
        new vs17(vs17.Arch.x86_64),
    ];
    return result;
};
