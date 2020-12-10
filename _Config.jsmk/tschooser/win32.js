/* global jsmk */
// toolset/win32.js:
//      - common windows-specific toolsets
exports.GetToolsets = function()
{
    let arduino = jsmk.LoadConfig("toolset/arduino.js").Toolset;
    let teensy = jsmk.LoadConfig("toolset/teensy.js").Toolset;
    let esp8266 = jsmk.LoadConfig("toolset/esp8266.js").Toolset;
    let vs17 = jsmk.LoadConfig("toolset/vs17.js").Toolset;

    var result = [
        new teensy("teensyLC"),
        new teensy("teensy40"),
        new teensy("teensy40_oc"),
        new esp8266("robodyn"),
        new esp8266("d1_mini"),
        new esp8266("generic"),
        new arduino("uno"),
        new vs17(vs17.Arch.x86_64),
    ];
    return result;
};
