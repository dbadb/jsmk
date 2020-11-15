/* global jsmk */
// refer to toolset/esp8266ref.txt
//
let GCC = require("../gcc.js").GCC;

// arduino compilation of core:abo.cpp
// "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\xtensa-lx106-elf-gcc\\2.5.0-4-b40a506/bin/xtensa-lx106-elf-g++" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/tools/sdk/include" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/tools/sdk/lwip2/include" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4/tools/sdk/libc/xtensa-lx106-elf/include" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_278104/core" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4\\cores\\esp8266" 
//  "-IC:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4\\variants\\generic" 
//  -D__ets__ -DICACHE_FLASH -U__STRICT_ANSI__ 
//  -c -w -Os -g -mlongcalls -mtext-section-literals 
//  -fno-rtti -falign-functions=4 -std=gnu++11 
//  -MMD -ffunction-sections -fdata-sections -fno-exceptions 
//  -DNONOSDK22x_190703=1 -DF_CPU=80000000L -DLWIP_OPEN_SRC 
//  -DTCP_MSS=536 -DLWIP_FEATURES=1 -DLWIP_IPV6=0 -DARDUINO=10812 
//  -DARDUINO_ESP8266_GENERIC -DARDUINO_ARCH_ESP8266 
//  "-DARDUINO_BOARD=\"ESP8266_GENERIC\"" -DLED_BUILTIN=2 
//  -DFLASHMODE_DOUT -DESP8266 
// "C:\\Users\\dana\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.7.4\\cores\\esp8266\\abi.cpp" 
// -o "C:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_278104\\core\\abi.cpp.o
//
// vs
// c:/Users/dana/AppData/Local/Arduino15/packages/esp8266/tools/xtensa-lx106-elf-gcc/2.5.0-4-b40a506/bin/xtensa-lx106-elf-g++.exe 
// -IC:/Users/dana/Documents/src/bitbucket.dbadb/iot/esp8266/libs 
// -Ic:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/include 
// -Ic:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/lwip2/include 
// -Ic:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/libc/xtensa-lx106-elf/include 
// -Ic:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/cores/esp8266 
// -Ic:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/variants/generic 
// -D__ets__ -DICACHE_FLASH -U__STRICT_ANSI__ 
// -c -Os -Wall -mlongcalls -mtext-section-literals 
// -MMD  -fno-rtti -falign-functions=4 -std=gnu++11 
// -ffunction-sections -fdata-sections -fno-exceptions 
// -DLWIP_OPEN_SRC -DTCP_MSS=536 -DLWIP_FEATURES=1 -DLWIP_IPV6=0 
// -DF_CPU=80000000L 
// -DARDUINO=10812 -DARDUINO_ARCH_ESP8266 -DFLASHMODE_DOUT -DESP8266 
// -DDEBUG_ESP_PORT=Serial -DNONOSDK22x_190703=1 -DARDUINO_ESP8266_GENERIC 
// -DLED_BUILTIN=2 -DARDUINO_BOARD=ESP8266_GENERIC 
// c:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/cores/esp8266/abi.cpp 
// -o C:/Users/dana/Documents/src/bitbucket.dbadb/iot/esp8266/.built/esp8266-generic-win32-win32-debug/libcore/abi.cpp.o

/* NB: board-specific settings belong in the toolset, not here
 *  (unless changes are keyed off the ARD_BOARD)
 */
function CommonInit(tool, ts)
{
    let defs = 
    {
        "__ets__": null,
        ICACHE_FLASH: null,
        F_CPU: ts.BuildVars.ARD_CPU_FREQ, // 80000000L
        LWIP_OPEN_SRC: null,
        TCP_MSS: 536,
        LWIP_FEATURES: 1,
        LWIP_IPV6: 0,
        ARDUINO: ts.BuildVars.ARD_VERS,
        ARDUINO_ARCH_ESP8266: null,
        FLASHMODE_DOUT: null,
        ESP8266: null,
        DEBUG_ESP_PORT: "Serial",
    };
    defs[ts.BuildVars.ESP_SDK] = 1;// Espressif Framework

    tool.Define( defs );

    tool.Define( {
        "d1_mini": {
            ARDUINO_ESP8266_WEMOS_D1MINI: null,
            ARDUINO_BOARD: ts.BuildVars.ARD_BOARD,
        },
        "generic": {
            ARDUINO_ESP8266_GENERIC: null,
            LED_BUILTIN: 2,
            ARDUINO_BOARD: "ESP8266_GENERIC",
        },
        "robodyn": {
            ARDUINO_ESP8266_GENERIC: null,
            LED_BUILTIN: 14,
            ARDUINO_BOARD: "ESP8266_GENERIC",
        }
        // more board types here.
    }[ts.BuildVars.ARD_BOARD]);

    tool.AddFlags(tool.GetRole(), [
        "-U__STRICT_ANSI__",
        "-c",
        // -g and -Os are handled via BuildVars and super
        "-Wall", // "-w", // supress all warnings
        "-mlongcalls", 
        "-mtext-section-literals",
        "-falign-functions=4",
        "-ffunction-sections", 
        "-fdata-sections",
        "-fno-exceptions", 
    ]);

    tool.AddSearchpaths( tool.GetRole(), [
        jsmk.path.join(ts.BuildVars.ARD_SDK, "include"),
        jsmk.path.join(ts.BuildVars.ARD_SDK, "lwip2/include"),
        jsmk.path.join(ts.BuildVars.ARD_SDK, "libc/xtensa-lx106-elf/include"),
        ts.BuildVars.ARD_CORE,
        ts.BuildVars.ARD_VARIANT,
    ]);
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
            "-Wpointer-arith",
            "-Wno-implicit-function-declaration",
            "-fno-inline-functions",
            "-Wl,-EL",
            "-nostdlib",
            "-std=gnu99",
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
        ]);
    }
}

class SC extends GCC /* uses cc for assembing but using -x below */
{
    constructor(ts, invoc)
    {
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} -o ${DSTFILE} ${SRCFILE}";
        super(ts, "esp8266/cpp", arg0, plist);
        CommonInit(this, ts);
        this.AddFlags(this.GetRole(), [
            ["-x", "assembler-with-cpp"],
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
