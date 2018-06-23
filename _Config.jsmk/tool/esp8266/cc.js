/* global jsmk */
// refer to toolset/esp8266ref.txt
//
let GCC = require("../gcc.js").GCC;

class CC extends GCC
{
    constructor(ts, invoc)
    {
        // cpreprocessor.flags
        //  -D__ets__ -DICACHE_FLASH -U__STRICT_ANSI__ \
        //      "-I{compiler.sdk.path}/include" \
        //      "-I{compiler.sdk.path}/lwip/include" \
        //      "-I{compiler.libc.path}/include" "-I{build.path}/core"
        // c.flags
        //  -c {compiler.warning_flags} -Os -g -Wpointer-arith \
        //  -Wno-implicit-function-declaration \
        //  -Wl,-EL -fno-inline-functions -nostdlib -mlongcalls \
        //  -mtext-section-literals -falign-functions=4 -MMD \
        //  -std=gnu99 -ffunction-sections -fdata-sections
        // recipe.c.o.pattern
        //   {compiler.c.flags} -DF_CPU={build.f_cpu} \
        //   {build.lwip_flags} {build.debug_port} {build.debug_level} \
        //   -DARDUINO={runtime.ide.version} -DARDUINO_{build.board} \
        //   -DARDUINO_ARCH_{build.arch} -DARDUINO_BOARD="{build.board}" \
        //   {compiler.c.extra_flags} {build.extra_flags} \
        //   {includes} "{source_file}" -o "{object_file}"
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} ${SRCFILE} -o ${DSTFILE}";
        super(ts, "esp8266/cc", arg0, plist);
        this.Define( {
            "__ets__": null,
            ICACHE_FLASH: null,
            F_CPU: ts.BuildVars.ARD_CPU_FREQ,
            LWIP_OPEN_SRC: null,
            DEBUG_ESP_PORT: "Serial",
            ARDUINO: ts.BuildVars.ARD_VERS,
            ARDUINO_ARCH_ESP8266: null,
            ESP8266: null,
        });
        this.Define( {
            "d1_mini": {
                ARDUINO_ESP8266_WEMOS_D1MINI: null,
                ARDUINO_BOARD: "ESP8266_WEMOS_D1MINI",
            },
            // more board types here.
        }[ts.BuildVars.ARD_BOARD]);

        this.AddFlags(this.GetRole(), [
            "-U__STRICT_ANSI__",
            "-c",
            "-g", // optimization should be handled in super
            // "-w", // supress all warnings
            "-Wall",
            "-Wpointer-arith",
            "-Wno-implicit-function-declaration",
            "-Wl,-EL",
            "-fno-inline-functions",
            "-nostdlib",
            "-mlongcalls",
            "-mtext-section-literals",
            "-falign-functions=4",
            "-std=gnu99",
            "-ffunction-sections",
            "-fdata-sections",
        ]);

        this.AddSearchpaths( "Compile", [
            jsmk.path.join(ts.BuildVars.ARD_SDK, "include"),
            jsmk.path.join(ts.BuildVars.ARD_SDK, "lwip/include"),
            jsmk.path.join(ts.BuildVars.ARD_SDK, "libc/xtensa-lx106-elf/include"),
            ts.BuildVars.ARD_CORE,
            ts.BuildVars.ARD_VARIANT,
        ]);
    } // end constructor

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }
}

class CPP extends GCC
{
    constructor(ts, invoc)
    {
        // cpreprocessor.flags
        //  -D__ets__ -DICACHE_FLASH -U__STRICT_ANSI__ \
        //      "-I{compiler.sdk.path}/include" \
        //      "-I{compiler.sdk.path}/lwip/include" \
        //      "-I{compiler.libc.path}/include" "-I{build.path}/core"
        //
        //  cpp.flags
        //      -c {compiler.warning_flags} \
        //      -Os -g -mlongcalls -mtext-section-literals \
        //      -fno-exceptions -fno-rtti -falign-functions=4 \
        //      -std=c++11 -MMD -ffunction-sections -fdata-sections

        //   recipe.cpp.o.pattern
        //      "{compiler.path}{compiler.cpp.cmd}" \
        //          {compiler.cpreprocessor.flags} \
        //          {compiler.cpp.flags} \
        //          -DF_CPU={build.f_cpu} \
        //          {build.lwip_flags} \
        //          {build.debug_port} \
        //          {build.debug_level} \
        //          -DARDUINO={runtime.ide.version} \
        //          -DARDUINO_{build.board} \
        //          -DARDUINO_ARCH_{build.arch} \
        //          -DARDUINO_BOARD="{build.board}" \
        //          {compiler.cpp.extra_flags} \
        //          {build.extra_flags} \
        //          {includes} "{source_file}" -o "{object_file}"

        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} ${SRCFILE} -o ${DSTFILE}";
        super(ts, "esp8266/cpp", arg0, plist);
        this.Define( {
            "__ets__": null,
            ICACHE_FLASH: null,
            F_CPU: ts.BuildVars.ARD_CPU_FREQ,
            LWIP_OPEN_SRC: null,
            DEBUG_ESP_PORT: "Serial",
            ARDUINO: ts.BuildVars.ARD_VERS,
            ARDUINO_ARCH_ESP8266: null,
            ESP8266: null,
        });
        this.Define( {
            "d1_mini": {
                ARDUINO_ESP8266_WEMOS_D1MINI: null,
                ARDUINO_BOARD: "ESP8266_WEMOS_D1MINI",
            },
            // more board types here.
        }[ts.BuildVars.ARD_BOARD]);

        this.AddFlags(this.GetRole(), [
            "-U__STRICT_ANSI__",
            "-c",
            "-g", // optimization should be handled in super
            "-Wall", // "-w", // supress all warnings
            "-mlongcalls", "-mtext-section-literals",
            "-fno-exceptions", "-fno-rtti", "-falign-functions=4",
            "-std=c++11", "-ffunction-sections", "-fdata-sections",
        ]);

        this.AddSearchpaths( this.GetRole(), [
            jsmk.path.join(ts.BuildVars.ARD_SDK, "include"),
            jsmk.path.join(ts.BuildVars.ARD_SDK, "lwip/include"),
            jsmk.path.join(ts.BuildVars.ARD_SDK, "libc/xtensa-lx106-elf/include"),
            ts.BuildVars.ARD_CORE,
            ts.BuildVars.ARD_VARIANT,
        ]);
    }
}

class SC extends GCC // arduino uses cc for assembing but using -x below
{
    constructor(ts, invoc)
    {
        let arg0 = jsmk.path.resolveExeFile(invoc);
        if(!arg0) throw new Error("Can't resolve esp8266 executable " + invoc);
        let plist = " ${FLAGS} ${DEFINES} ${SEARCHPATHS} -o ${DSTFILE} ${SRCFILE}";
        super(ts, "esp8266/cpp", arg0, plist);

        // compiler.S.flags
        //  -c -g -x assembler-with-cpp -MMD -mlongcalls
        // recipe.S.o.pattern
        //  "{compiler.path}{compiler.c.cmd}" {compiler.cpreprocessor.flags} \
        //  {compiler.S.flags} \
        //  -DF_CPU={build.f_cpu} \
        //  {build.lwip_flags} \
        //  {build.debug_port} \
        //  {build.debug_level} \
        //  -DARDUINO={runtime.ide.version} \
        //  -DARDUINO_{build.board} -DARDUINO_ARCH_{build.arch} \
        //  -DARDUINO_BOARD="{build.board}" {compiler.c.extra_flags} \
        //  {build.extra_flags} {includes} "{source_file}" -o "{object_file}"

        this.Define( {
            "__ets__": null,
            ICACHE_FLASH: null,
            F_CPU: ts.BuildVars.ARD_CPU_FREQ,
            LWIP_OPEN_SRC: null,
            DEBUG_ESP_PORT: "Serial",
            ARDUINO: ts.BuildVars.ARD_VERS,
            ARDUINO_ARCH_ESP8266: null,
            ESP8266: null,
        });
        this.Define( {
            "d1_mini": {
                ARDUINO_ESP8266_WEMOS_D1MINI: null,
                ARDUINO_BOARD: "ESP8266_WEMOS_D1MINI",
            },
            // more board types here.
        }[ts.BuildVars.ARD_BOARD]);
        this.AddFlags(this.GetRole(), [
            "-c", "-g", "-mlongcalls",
            ["-x", "assembler-with-cpp"],
        ]);
        this.AddSearchpaths( this.GetRole(), [
            jsmk.path.join(ts.BuildVars.ARD_SDK, "include"),
            jsmk.path.join(ts.BuildVars.ARD_SDK, "lwip/include"),
            jsmk.path.join(ts.BuildVars.ARD_SDK, "libc/xtensa-lx106-elf/include"),
            ts.BuildVars.ARD_CORE,
            ts.BuildVars.ARD_VARIANT,
        ]);
    }
}

exports.CC = CC;
exports.CPP = CPP;
exports.SC = SC;
