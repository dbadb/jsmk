/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

/* arduino output
 Linking everything together...

"${HOME}\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-gcc" 
    -w -Os -g -flto -fuse-linker-plugin -Wl,--gc-sections -mmcu=atmega328p 
    -o "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/BlinkUno.ino.elf" 
    "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073\\sketch\\BlinkUno.ino.cpp.o" 
    "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/core\\core.a" 
    "-L${HOME}\\AppData\\Local\\Temp\\arduino_build_32073" 
    -lm
"${HOME}\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-objcopy" 
    -O ihex -j .eeprom 
    --set-section-flags=.eeprom=alloc,load 
    --no-change-warnings --change-section-lma .eeprom=0 
    "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/BlinkUno.ino.elf" 
    "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/BlinkUno.ino.eep"
"${HOME}\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-objcopy" 
    -O ihex -R .eeprom 
    "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/BlinkUno.ino.elf" 
    "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/BlinkUno.ino.hex"

"${HOME}\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-size" 
    -A "${HOME}\\AppData\\Local\\Temp\\arduino_build_32073/BlinkUno.ino.elf"
Sketch uses 3874 bytes (12%) of program storage space. Maximum is 32256 bytes.
Global variables use 216 bytes (10%) of dynamic memory, leaving 1832 bytes for local variables. Maximum is 2048 bytes.

*/
class Link extends ToolCli
{
    constructor(ts, invocation)
    {
        let exefile = invocation;
        let arg0 = jsmk.path.resolveExeFile(exefile);
        super(ts, "arduino/link",
            {
                Role: ToolCli.Role.Link,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: "elf",
                ActionStage: "build",
                Invocation: [arg0, 
                    "-o", "${DSTFILE}",
                    "${FLAGS}",
                    "${SEARCHPATHS}",
                    "${SRCFILES}" ,
                    "${LIBS}"
                ],
                Syntax:
                {
                    Flag: "${VAL}",
                    Searchpath: "-L${VAL}",
                    Lib: "-l${VAL}",
                },
            }
        );

        this.AddFlags(this.GetRole(), [
            "-flto",
            "-fuse-linker-plugin",
            "-Wl,--gc-sections",
            "-mmcu=${ARD_MCU}"
        ]);

    }

    ConfigureTaskSettings(task)
    {
        // add output dir to searchpaths
        super.ConfigureTaskSettings(task);
        task.AddSearchPaths(this.GetRole(), [task.GetOutputDir()]);
    }
}  // end of link

exports.Link = Link;
