/* global jsmk */
let GCC = require("../gcc.js").GCC;

// Here we define two classes,  CC and CPP..
//
// It's possible that teensy is better represented as a framework
// rather than a compiler.  On the other hand, the choice of compiler
// is pretty-well tied down by teensy (and tightly coupled with
// its collection of compiler flags).
class CC extends GCC
{
    constructor(ts, invoc)
    {
        let gcc = invoc ? invoc : "gcc";
        let exefile = `arm-none-eabi-${gcc}`;
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) throw new Error("Can't resolve teensy CC executable");
        super(ts, "teensy/cc", arg0);
        this.Define( {
            ARDUINO: "10612",
            TEENSYDUINO: "134",
            ARDUINO_ARCH_AVR: null,
            USB_SERIAL_HID:  null, // serial + usb + mouse + joystick
                                   // modify to change MANUFACTURE and PRODUCT
            //USB_SERIAL_HID_DB: null, // doesn't work, usb_undef.h
            // USB_KEYBOARDONLY: null,
            LAYOUT_US_ENGLISH: null,
            __TEENSYBOARD:  null

            // NB  MANUFACTURER_NAME, MANUFACTURE_NAME_LEN
            //     PRODUCT_NAME, PRODUCT_NAME_LEN are found in
            //      teensy3/usb_desc.h.
            //     since F_CPU  >  20000000, we don't need to mod
            //      teensy3/usb_inst.cpp
        });

        this.AddFlags([
                "-c",
                "--specs=nano.specs",
                "-Wall",
                "-ffunction-sections",
                "-fdata-sections",
                "-fsingle-precision-constant",
                "-nostdlib",
                "-fno-exceptions",
                "-mthumb",
            ]);

        if(gcc === "g++")
        {
            this.AddFlags([
                "-fno-rtti",
                "-std=gnu++0x",
                "-felide-constructors",
            ]);
        }

        this.AddSearchpaths( "Compile", [
            "${TEENSYSRC}",
            "${TEENSYLIBS}"
        ]);
    } // end constructor

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        switch(task.BuildVars.TEENSYBOARD)
        {
        case "TEENSY31":
            task.Define({
                    F_CPU: "96000000",
                    "__MK20DX256__": null,
                });
            task.AddFlags([
                    "-mcpu=cortex-m4",
                ]);
            break;
        case "TEENSYLC":
            task.Define({
                    F_CPU: "48000000",
                    "__MKL26Z64__":  null,
                }),
            task.AddFlags([
                    "-mcpu=cortex-m0plus",
                ]);
            break;
        default:
            jsmk.WARNING("Teensy compiler requires TEENSYBOARD selection");
        }
    }
}

class CPP extends CC
{
    constructor(toolset)
    {
        super(toolset, "g++");
    }
}

exports.CC = CC;
exports.CPP = CPP;
