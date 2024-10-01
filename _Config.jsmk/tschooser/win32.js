/* global jsmk */
// toolset/win32.js:
//      - common windows-specific toolsets
exports.GetToolsets = function()
{
    let arduino = jsmk.LoadConfig("toolset/arduino.js").Toolset;
    let teensy = jsmk.LoadConfig("toolset/teensy.js").Toolset;
    let esp8266 = jsmk.LoadConfig("toolset/esp8266.js").Toolset;
    //let vs17 = jsmk.LoadConfig("toolset/vs17.js").Toolset;
    let vs22 = jsmk.LoadConfig("toolset/vs22.js").Toolset;
    let clang = jsmk.LoadConfig("toolset/clang.js").Toolset;

    let result = [];
    try
    {
        result.push(new teensy("teensyLC"));
        result.push(new teensy("teensy40"));
        result.push(new teensy("teensy40_oc"));
    }
    catch(err)
    {
        jsmk.DEBUG("tschooser: no teensy dev on windows " + err);
    }

    try
    {
        result.push(new esp8266("robodyn"));
        result.push(new esp8266("d1_mini"));
        result.push(new esp8266("generic"));
        result.push(new arduino("uno"));
    }
    catch(err)
    {
        jsmk.DEBUG("tschooser: no arduino dev on windows "+err);
    }
    
    try
    {
        result.push(new vs22(vs22.Arch.x86_64));
        result.push(new clang());
    }
    catch(err)
    {
        jsmk.WARNING("tschooser: no c++ dev on windows " + err);
    }
    console.log(`win32 tschooser: ${result.length} toolsets.`);
    return result;
};
