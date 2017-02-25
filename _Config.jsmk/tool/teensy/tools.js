var cc = {
    tooltype: "compiler",
    invocation: {
         "cpp->o": "arm-none-eabi-g++ ${SRCFILE} -o ${DSTFILE} " +
                    "${FLAGS} ${DEFINES} ${INCLUDES}",
         "c->o":   "arm-none-eabi-gcc ${SRCFILE} -o ${DSTFILE} " +
                    "${FLAGS} ${DEFINES} ${INCLUDES}",
    },

    syntax: {
        define: "-D${KEY}=${VAL}",
        include: "-I${VAL}",
        flag: "${VAL}",
    },

    define: {
        ARDUINO:          "10605",
        TEENSYDUINO:      "124",
        ARDUINO:          "10605",
        ARDUINO_ARCH_AVR: null,
        //USB_SERIAL_NEWHID:   null,
        USB_SERIAL_HID:   null,
        LAYOUT_US_ENGLISH: null,
        __TEENSYBOARD:  null
    },
    define_TEENSYBOARD: {
        TEENSY31: {
            F_CPU:             "96000000",
            "__MK20DX256__":     null,
        },
        TEENSYLC: {
            F_CPU:              "48000000",
            "__MKL26Z64__":       null,
        },
    }
    define_DEPLOYMENT: {
        debug: {
        },
        release: {
        }
    }
    flag: [
        "-c",
        "-O",
        "-g",
        "-Wall",
        "-ffunction-sections",
        "-fdata-sections",
        "-MMD", // for mkdep
        "-nostdlib",
        "-fno-exceptions",
        "-mthumb",
        "-fno-rtti",
        "-std=gnu++0x",
        "-felide-constructors",
    }
    flag_TEENSYBOARD: {
        TEENSY31: [
            "-mcpu=cortex-m4",
        ],
        TEENSYLC: [
            "-mcpu=cortex-m0plus",
        ]
    },
    flag_DEPLOYMENT: {
        debug: [],
        release: [],
    },
}; // end of var cc

var link = {
    tooltype: "linker",
    invocation: {
        "cpp.o->elf": "arm-none-eabi-gcc ${FLAGS} " +
        "-o ${DSTFILE} ${SRCFILES} ${LIBS}"
    },
    syntax: {
        flag: "${VAL}"
    },
    flag: [
        "-O",
        "-Wl,--gc-sections,--relax,--defsym=__rtc_localtime=1432291410",
        "-mthumb",
    ],
    flag_${DEPLOYMENT}: {
        TEENSY31: [
            "-T${TEENSYSRC}/mk20dx256.ld",
            "-mcpu=cortex-m4"
        ],
        TEENSYLC: [
            "-T${TEENSYSRC}/mkl26z64.ld",
            "--specs=nano.specs",
            "-mcpu=cortex-m0plus"
        ],
    ],
    lib: [
        "-L${TEENSYSRC}",
        "_inheritlist:lib.${TEENSYBOARD}",
        "-lm",
    lib_:
        {
            TEENSY31: ["-larm_cortexM4l_math"],
            TEENSYLC:  ["-larm_cortexM0l_math"]
        },
    ],
};  // end of link

exports.Tools = {
    ar: {
        tooltype: "archiver",
        invocation: "arm-none-eabi-ar cr ${DSTFILE} ${SRCFILES}"
    },
    cc: cc,
    cpp: cc,
    link: link,
    objcopy: {
        tooltype: "cli -semantics one-to-one -dstExt _infer",
        invocation: {
            "elf->hex": "arm-none-eabi-objcopy -O ihex -R " +
                        ".eepprop ${SRCFILE} ${DSTFILE}",
            "elf->eep": "arm-none-eabi-objcopy -O ihex -j .eeprom " +
                        "--set-section-flags=.eeprom=alloc,load " +
                        "--no-change-warnings --change-section-lma .eeprom=0 " +
                        "${SRCFILE} ${DSTFILE}",
        },
    },
    postcompile: {
      tooltype: "cli -semantics one-to-none -dstExt _infer -stage test",
      invocation: "teensy_post_compile -file=${SRCFILEBASENOEXT} " +
                   "-path=${JsmkBuiltDir.module} ${FLAGS}",
      flag: [
        "-tools=${TEENSYTOOLS}",
        "-board=${TEENSYBOARD}",
        "-reboot"
        ],
    },
}; // end of Tools

/*
teensy_post_compile -file=Blink.cpp \
-path=C:\Users\dana\AppData\Local\Temp\build2759480834523177520.tmp \
-tools=C:\Program Files (x86)\Arduino-1.6.4/hardware/tools \
-board=TEENSYLC
*/
