/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

/* arduino output
  "C:/Users/dana/AppData/Local/Arduino15/packages/esp8266/tools/xtensa-lx106-elf-gcc/2.5.0-4-b40a506/bin/xtensa-lx106-elf-gcc" 
  -fno-exceptions -Wl,-Map "-Wl,C:/Users/dana/AppData/Local/Temp/arduino_build_278104/WIFIUnoTest.ino.map" 
  -g -w -Os -nostdlib -Wl,--no-check-sections -u app_entry -u _printf_float -u _scanf_float 
  -Wl,-static 
  "-LC:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/lib" 
  "-LC:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/lib/NONOSDK22x_190703" 
  "-LC:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/ld" 
  "-LC:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/libc/xtensa-lx106-elf/lib" 
  -Teagle.flash.1m64.ld 
  -Wl,--gc-sections 
  -Wl,-wrap,system_restart_local 
  -Wl,-wrap,spi_flash_read 
  -o "C:/Users/dana/AppData/Local/Temp/arduino_build_278104/WIFIUnoTest.ino.elf" 
  -Wl,--start-group 
  "C:/Users/dana/AppData/Local/Temp/arduino_build_278104/sketch/WIFIUnoTest.ino.cpp.o" 
  "C:/Users/dana/AppData/Local/Temp/arduino_build_278104/libraries/ESP8266WiFi/ESP8266WiFi.a" 
  "C:/Users/dana/AppData/Local/Temp/arduino_build_278104/core/core.a" 
  -lhal -lphy -lpp -lnet80211 -llwip2-536-feat -lwpa -lcrypto -lmain -lwps 
  -lbearssl -laxtls -lespnow -lsmartconfig -lairkiss -lwpa2 -lstdc++ -lm -lc -lgcc 
  -Wl,--end-group 
  "-LC:/Users/dana/AppData/Local/Temp/arduino_build_278104"

our output:
 c:/Users/dana/AppData/Local/Arduino15/packages/esp8266/tools/xtensa-lx106-elf-gcc/2.5.0-4-b40a506/bin/xtensa-lx106-elf-gcc.exe 
 -o ROOT/.built/esp8266-generic-win32-win32-debug/Blink/blink.elf 
 -fno-exceptions -Wl,-static 
 -g -w -Os -nostdlib -Wl,--no-check-sections -u app_entry -u _printf_float -u _scanf_float 
 -Teagle.flash.1m64.ld -Wl,--gc-sections 
 -Wl,-wrap,system_restart_local -Wl,-wrap,spi_flash_read 
 -Wl,-Map -Wl,ROOT/.built/esp8266-generic-win32-win32-debug/Blink/blink.map -Lc:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/lib -Lc:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/lib/NONOSDK22x_190703 -Lc:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/ld -Lc:/Users/dana/AppData/Local/Arduino15/packages/esp8266/hardware/esp8266/2.7.4/tools/sdk/libc/xtensa-lx106-elf/lib -LROOT/.built/esp8266-generic-win32-win32-debug/Blink 
 -Wl,--start-group ROOT/.built/esp8266-generic-win32-win32-debug/Blink/blink.cpp.o ROOT/.built/esp8266-generic-win32-win32-debug/libcore/libcore.a -lhal -lphy -lpp -lnet80211 -llwip2-536-feat -lwpa -lcrypto -lmain -lwps 
 -lbearssl -laxtls -lespnow -lsmartconfig -lairkiss -lwpa2 -lstdc++ -lm -lc -lgcc 
 -Wl,--end-group
*/
class Link extends ToolCli
{
    constructor(ts, invocation)
    {
        let exefile = invocation;
        let arg0 = jsmk.path.resolveExeFile(exefile);
        super(ts, "esp8266/link",
            {
                Role: ToolCli.Role.Link,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: "elf",
                ActionStage: "build",
                Invocation: [arg0, "-o ${DSTFILE} " +
                    "${FLAGS} " +
                    "${SEARCHPATHS} " +
                    "-Wl,--start-group ${SRCFILES} ${LIBS} -Wl,--end-group"
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
            "-fno-exceptions",
            "-Wl,-static",
            "-g", "-w", "-Os", "-nostdlib",
            "-Wl,--no-check-sections",
            ["-u", "app_entry"],
            ["-u", "_printf_float"],
            ["-u", "_scanf_float"],
            "-Teagle.flash.1m64.ld", // 4m1m.ld", 4m is 3m spiffs, 4m1m is 1m spiffs
            "-Wl,--gc-sections",
            "-Wl,-wrap,system_restart_local",
            "-Wl,-wrap,spi_flash_read",
        ]);

        let sdk = jsmk.path.join(ts.BuildVars.ARD_TOOLS, "sdk");
        this.AddSearchpaths(this.GetRole(), [
            jsmk.path.join(sdk, "lib"),
            jsmk.path.join(sdk, "lib", ts.BuildVars.ESP_SDK),
            jsmk.path.join(sdk, "ld"),
            jsmk.path.join(sdk, "libc/xtensa-lx106-elf/lib"),
        ]);

        this.AddLibraries([
            "hal", "phy", "pp", "net80211",
            "lwip2-536-feat", "wpa", "crypto",
            "main", "wps", "bearssl", "axtls", "espnow",
            "smartconfig", "airkiss", "wpa2", "stdc++",
            "m", "c", "gcc"
        ]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        task.AddSearchPaths(this.GetRole(), [task.GetOutputDir()]);
        let mapfile = jsmk.path.join(task.GetOutputDir(), task.GetName()+".map");
        task.AddFlags(this.GetRole(), [
            ["-Wl,-Map", `-Wl,${mapfile}`]
        ]);
    }
}  // end of link

exports.Link = Link;
