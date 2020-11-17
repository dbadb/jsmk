/* global jsmk */
// refer to toolset/esp8266ref.txt
//
let GCC = require("../gcc.js").GCC;

// arduino compilation of core:
//
// S->o
// "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-gcc" 
//  -c -g -x assembler-with-cpp -flto -MMD 
//  -mmcu=atmega328p -DF_CPU=16000000L -DARDUINO=10812 
//  -DARDUINO_AVR_UNO -DARDUINO_ARCH_AVR 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\cores\\arduino" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\variants\\standard" 
//  "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\cores\\arduino\\wiring_pulse.S" 
//  -o "C:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_32073\\core\\wiring_pulse.S.o"
//
// c->o
// "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-gcc" 
//  -c -g -Os -w -std=gnu11 -ffunction-sections -fdata-sections -MMD 
//  -flto -fno-fat-lto-objects -mmcu=atmega328p -DF_CPU=16000000L 
//  -DARDUINO=10812 -DARDUINO_AVR_UNO -DARDUINO_ARCH_AVR 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\cores\\arduino" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\variants\\standard" 
//  "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\cores\\arduino\\wiring_digital.c" 
//  -o "C:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_32073\\core\\wiring_digital.c.o"
//
// .cpp->o
// "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\tools\\avr-gcc\\7.3.0-atmel3.6.1-arduino7/bin/avr-g++" 
//  -c -g -Os -w -std=gnu++11 -fpermissive -fno-exceptions -ffunction-sections -fdata-sections 
//  -fno-threadsafe-statics -Wno-error=narrowing -MMD -flto -mmcu=atmega328p 
//  -DF_CPU=16000000L -DARDUINO=10812 -DARDUINO_AVR_UNO -DARDUINO_ARCH_AVR 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\cores\\arduino" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\variants\\standard" 
//  "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\arduino\\hardware\\avr\\1.8.3\\cores\\arduino\\HardwareSerial0.cpp" 
//  -o "C:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_32073\\core\\HardwareSerial0.cpp.o"

/* NB: board-specific settings belong in the toolset, not here
 *  (unless changes are keyed off the ARD_BOARD)
 */
function CommonInit(tool, ts, asmOnly=false)
{
    let defs = 
    {
        F_CPU: ts.BuildVars.ARD_CPU_FREQ, // 80000000L
        ARDUINO: ts.BuildVars.ARD_VERS,
    };

    tool.Define( defs );

    tool.Define( {
        "uno": {
            ARDUINO_AVR_UNO: null,
            ARDUINO_ARCH_AVR: null
        },
        // more board types here.
    }[ts.BuildVars.ARD_BOARD]);

    tool.AddFlags(tool.GetRole(), [
        "-mmcu=${ARD_MCU}",
        "-flto",
        "-c",
        // -MMD, -Os, -g handled by super
    ]);
    if(!asmOnly)
    {
        tool.AddFlags(tool.GetRole(),
        [
            "-ffunction-sections",
            "-fdata-sections",
        ]);
    }

    tool.AddSearchpaths( tool.GetRole(), [
        ts.BuildVars.ARD_CORE,
        ts.BuildVars.ARD_VARIANT,
    ]);
}

class SC extends GCC /* uses cc for assembing but using -x below */
{
    constructor(ts, invoc)
    {
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve arduino executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} -o ${DSTFILE} ${SRCFILE}";
        super(ts, "arduino/sc", arg0, plist);
        CommonInit(this, ts, true);
        this.AddFlags(this.GetRole(), [
            ["-x", "assembler-with-cpp"],
        ]);
    }
}

class CC extends GCC
{
    constructor(ts, invoc)
    {
        // CC and CPP share a lot of flags and includes
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} ${SRCFILE} -o ${DSTFILE}";
        super(ts, "esp8266/cc", arg0, plist);
        CommonInit(this, ts);
        /* here are cc-specific */
        this.AddFlags(this.GetRole(), [
            "-std=gnu11",
            "-fno-fat-lto-objects"
        ]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }
}

class CPP extends GCC 
{
    constructor(ts, invoc)
    {
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} ${SRCFILE} -o ${DSTFILE}";
        super(ts, "esp8266/cpp", arg0, plist);
        CommonInit(this, ts);
        this.AddFlags(this.GetRole(), [
            "-fno-rtti", 
            "-std=gnu++11", 
            "-fpermissive",
            "-fno-exceptions",
            "-fno-threadsafe-statics",
            "-Wno-error=narrowing"
        ]);
    }
}

class PRELOAD extends GCC // ->ld (generates a .ld script)
{
    constructor(ts, invoc, ldinput)
    {
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) 
            throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} ${SRCFILE} "+
                    "-o ${BUILTDIR}/local.eagle.app.v6.common.ld";
        super(ts, "esp8266/mkld", arg0, plist);
        this.AddFlags(this.GetRole(), 
        [
            "-CC",
            "-E",
            "-P",
            "-DVTABLES_IN_FLASH",
        ]);
        this.ldinput = ldinput;
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        task.AddInputs([this.ldinput]);
    }
}

exports.CC = CC;
exports.CPP = CPP;
exports.SC = SC;
exports.PRELOAD = PRELOAD;
