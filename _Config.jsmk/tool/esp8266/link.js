/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

/*
compiler.c.elf.flags
    -g {compiler.warning_flags} \
    -Os -nostdlib \
    -Wl,--no-check-sections \
    -u call_user_start \
    -u _printf_float \
    -u _scanf_float \
    -Wl,-static \
    "-L{compiler.sdk.path}/lib" \
    "-L{compiler.sdk.path}/ld" \
    "-L{compiler.libc.path}/lib" \
    "-T{build.flash_ld}" \
    -Wl,--gc-sections \
    -Wl,-wrap,system_restart_local \
    -Wl,-wrap,spi_flash_read

compiler.c.elf.libs
    -lhal -lphy -lpp -lnet80211 \
    {build.lwip_lib} -lwpa -lcrypto \
    -lmain -lwps -laxtls -lespnow \
    -lsmartconfig -lmesh -lwpa2 -lstdc++ \
    -lm -lc -lgcc

recipe.c.combine.pattern
    "{compiler.path}{compiler.c.elf.cmd}" \
    {compiler.c.elf.flags} {compiler.c.elf.extra_flags} \
    -o "{build.path}/{build.project_name}.elf" \
    -Wl,--start-group {object_files} \
    "{build.path}/arduino.ar" \
    {compiler.c.elf.libs} \
    -Wl,--end-group  \
    "-L{build.path}"
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
            "-g", "-Wall",
            "-Os", "-nostdlib",
            "-Wl,--no-check-sections",
            ["-u", "call_user_start"],
            ["-u", "_printf_float"],
            ["-u", "_scanf_float"],
            "-Wl,-static",
            "-Teagle.flash.4m1m.ld", // 4m is 3m spiffs, 4m1m is 1m spiffs
            "-Wl,--gc-sections",
            "-Wl,-wrap,system_restart_local",
            "-Wl,-wrap,spi_flash_read",
        ]);

        let sdk = jsmk.path.join(ts.BuildVars.ARD_TOOLS, "sdk");
        this.AddSearchpaths(this.GetRole(), [
            jsmk.path.join(sdk, "lib"),
            jsmk.path.join(sdk, "ld"),
            jsmk.path.join(sdk, "libc/xtensa-lx106-elf/lib"),
        ]);

        this.AddLibraries([
            "hal", "phy", "pp", "net80211",
            "lwip_gcc", "wpa", "crypto",
            "main", "wps", "axtls", "espnow",
            "smartconfig", "mesh", "wpa2", "stdc++",
            "m", "c", "gcc"
        ]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }
}  // end of link

exports.Link = Link;
