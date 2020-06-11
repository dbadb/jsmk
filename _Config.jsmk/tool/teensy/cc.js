/* global jsmk */
let GCC = require("../gcc.js").GCC;

// Here we define two classes,  CC and CPP..
//
// It's possible that teensy is better represented as a framework
// rather than a compiler.  On the other hand, the choice of compiler
// is pretty-well tied down by teensy (and tightly coupled with
// its collection of compiler flags).
// "../arm-none-eabi-g++" -c -Os \
//    --specs=nano.specs -g -Wall -ffunction-sections \
//    -fdata-sections -nostdlib -MMD -fno-exceptions \
//    -fpermissive -felide-constructors -std=gnu++14 \
//    -Wno-error=narrowing -fno-rtti -mthumb \
//    -mcpu=cortex-m0plus -fsingle-precision-constant \
//    -D__MKL26Z64__ -DTEENSYDUINO=152 -DARDUINO=10812 \
//    -DARDUINO_TEENSYLC -DF_CPU=48000000 -DUSB_SERIAL \
//    -DLAYOUT_US_ENGLISH \
//    "-IC:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_438011/pch" 
//    "-IC:\\Users\\dana\\Documents\\arduino-1.8.12\\hardware\\teensy\\avr\\cores\\teensy3" \
//    "-IC:\\Users\\dana\\Documents\\arduino-1.8.12\\hardware\\teensy\\avr\\libraries\\Bounce"\
//    "-IC:\\Users\\dana\\Documents\\Arduino\\libraries\\SevSeg-3.3.0"\
//    "-IC:\\Users\\dana\\Documents\\Arduino\\libraries\\SharpDistSensor"\
//    "C:\\Users\\dana\\Documents\\Arduino\\libraries\\SharpDistSensor\\SharpDistSensor.cpp"\
//    -o "C:\\Users\\dana\\AppData\\Local\\Temp\\arduino_build_438011\\libraries\\SharpDistSensor\\SharpDistSensor.cpp.o"
class CC extends GCC
{
    constructor(ts, invoc)
    {
        let gcc = invoc ? invoc : "gcc";
        let exefile = `arm-none-eabi-${gcc}`;
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) 
            throw new Error("Can't resolve teensy CC executable "+exefile);
        super(ts, "teensy/cc", arg0);
        this.SetBuildVar("SERIAL_MODE", "USB_SERIAL_HID");
        this.Define( {
            ARDUINO: "10812",
            TEENSYDUINO: "152",
            ARDUINO_ARCH_AVR: null,
            /*
             * USB_SERIAL_HID:  null, (shouldn't be defined for MIDI)
             * // serial + usb + mouse + joystick
               // modify to change MANUFACTURE and PRODUCT
            */
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

        this.AddFlags(this.GetRole(), [
                "-c",
                "--specs=nano.specs",
                "-Wall",
                "-ffunction-sections",
                "-fdata-sections",
                "-fsingle-precision-constant",
                "-nostdlib",
                "-fno-exceptions",
                "-mthumb",
                "-Wno-error=narrowing", 
            ]);

        if(gcc === "g++")
        {
            this.AddFlags(this.GetRole(), [
                "-fno-rtti", "-fpermissive", "-std=gnu++14",
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
        // USBTYPE must be one of arduino's types (selected from Tools menu)
        // (see usb_desc.h for exact values)
        let defaultDefs = {};
        console.assert(task.BuildVars.USBTYPE.length > 0);
        defaultDefs[task.BuildVars.USBTYPE]  = null;
        task.Define(defaultDefs);
        switch(task.BuildVars.TEENSYBOARD)
        {
        case "TEENSY31":
            task.Define({
                    F_CPU: "96000000",
                    "__MK20DX256__": null,
                });
            task.AddFlags(this.GetRole(), [
                    "-mcpu=cortex-m4",
                ]);
            break;
        case "TEENSYLC":
            task.Define({
                    F_CPU: "48000000",
                    "__MKL26Z64__":  null,
                    "ARDUINO_TEENSYLC": null,
                }),
            task.AddFlags(this.GetRole(), [
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
