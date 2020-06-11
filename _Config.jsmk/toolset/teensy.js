/* global jsmk */
var Foundation = require("./foundation.js").Foundation;
/*
Linking everything together...
arm-none-eabi-gcc -Os \
    --specs=nano.specs \
    -Wl,--gc-sections,--relax,--defsym=__rtc_localtime=1591875999 \
    "-TC:\\Users\\dana\\Documents\\arduino-1.8.12\\hardware\\teensy\\avr\\cores\\teensy3/mkl26z64.ld" \
    -lstdc++ -mthumb -mcpu=cortex-m0plus -fsingle-precision-constant \
    -o "C:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_479489/controlsurface.ino.elf" \
    ...OBJFILES...
    SPI.cpp.o SoftwareSerial.cpp.o Adafruit_SSD1306.cpp.o Wire.cpp.o \
    WireIMXRT.cpp.o WireKinetis.cpp.o twi.c.o glcdfont.c.o \
    Adafruit_GFX.cpp.o Adafruit_SPITFT.cpp.o core.a\
    -LC:../arduino_build_479489 \
    -larm_cortexM0l_math -lm
arm-none-eabi-objcopy -O ihex -j .eeprom \
    --set-section-flags=.eeprom=alloc,load \
    --no-change-warnings --change-section-lma \
    .eeprom=0 .../controlsurface.ino.elf  .../controlsurface.ino.eep
arm-none-eabi-objcopy -O ihex -R .eeprom \
    .../controlsurface.ino.elf .../controlsurface.ino.hex
arm-none-eabi-objdump -d -S -C .../controlsurface.ino.elf
arm-none-eabi-objdump -t -C .../controlsurface.ino.elf
arm-none-eabi-size -A .../BlinkTeensy.ino.elf
teensy_post_compile -file=controlsurface.ino -path=(tobuiltarea) \
    -tools=.../teensy/../tools/" \
    -board=TEENSYLC
*/

class Teensy extends Foundation
{
     constructor()
     {
        super(__filename, "teensy", Foundation.Arch.unspecified);

        let ardroot = "c:/Users/dana/Documents/arduino-1.8.12";
        let ardlibs = jsmk.path.join(ardroot, "../Arduino/libraries");
        let t3src = jsmk.path.join(ardroot, "hardware/teensy/avr/cores/teensy3");
        let dbsrc = "/mnt/d/dana/src/teensy/nih/libcore/teensy-cores/teensy3";
        let teensycore = jsmk.path.join(ardroot, "hardware/teensy/avr/cores/teensy3");
        let teensytools = jsmk.path.join(ardroot, "hardware/tools");
        let teensybin = jsmk.path.join(teensytools, "arm/bin");
        let map = {};

        map.BuildVars =
        {
            ARDROOT: ardroot,
            ARDLIBS: ardlibs,
            TEENSYSRC: t3src,
            TEENSYLIBS: jsmk.path.join(ardroot, "hardware/teensy/avr/libraries"),
            TEENSYTOOLS: teensytools,
            // TEENSYBOARD: "TEENSY31",
            TEENSYBOARD: "TEENSYLC",
            TEENSYCORE: teensycore,
            TEENSYPATH:  [teensybin, teensytools],
        };

        this.MergeSettings(map);

        let cc = jsmk.LoadConfig("tool/teensy/cc.js");
        let link = jsmk.LoadConfig("tool/teensy/link.js");
        let misc = jsmk.LoadConfig("tool/teensy/misc.js");

        this.MergeToolMap(
            {
                "cpp->o": new cc.CPP(this),
                "c->o": new cc.CC(this),
                "cpp.o->elf": new link.Link(this),
                "o->a": new misc.AR(this),
                "elf->eep": new misc.ObjCopy(this, "elf->eep"), // eeprom (data)
                "elf->hex": new misc.ObjCopy(this, "elf->hex"), // non-data
                "report": new misc.ReportSize(this),
                "postcompile": new misc.PostCompile(this)
            }
        );
        jsmk.DEBUG("Teensy toolset loaded");
    } // end constructor
}

exports.Toolset = Teensy;
