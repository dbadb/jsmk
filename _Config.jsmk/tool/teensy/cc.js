/* global jsmk */
let GCC = require("../gcc.js").GCC;

// Here we define two classes,  CC and CPP..
//
// It's possible that teensy is better represented as a framework
// rather than a compiler.  On the other hand, the choice of compiler
// is pretty-well tied down by teensy (and tightly coupled with
// its collection of compiler flags). So for now we embody different
// Teensy chips as differnt instantiations of the teensy toolset.
//
// see toolchain.txt for refs
//

class CC extends GCC // shared with g++, only different invoc
{
    constructor(ts, invoc, rule)
    {
        let gcc = invoc ? invoc : "gcc";
        let exefile = `arm-none-eabi-${gcc}`;
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.TEENSYPATH);
        if(!arg0) 
            throw new Error("Can't resolve teensy CC executable "+exefile);
        super(ts, "teensy/cc", arg0);
        this.SetBuildVar("SERIAL_MODE", "USB_SERIAL_HID");

        if(rule === "S->o")
            this.AddFlags(this.GetRole(), [
                ["-x", "assembler-with-cpp"]
            ]);

        // shared flags across c & cpp ------------------------------
        this.AddFlags(this.GetRole(), [
                "-c",
                "-Wall", "-ffunction-sections", "-fdata-sections", "-nostdlib",
                "-mthumb", 
            ]);

        // c vs c++ flags
        if(gcc === "g++")
        {
            this.AddFlags(this.GetRole(), [
                "-fno-exceptions", 
                "-fpermissive",  
                "-fno-rtti", 
                "-felide-constructors",
                "-fno-threadsafe-statics", 
                "-std=gnu++14", 
                "-Wno-error=narrowing", 
            ]);
        }

        // shared Defines --------------------------------------------------
        this.Define( {
            ARDUINO: "${ARDUINO}",
            TEENSYDUINO: "${TEENSYDUINO}",
            /*
             * USB_SERIAL_HID:  null, (shouldn't be defined for MIDI)
             * // serial + usb + mouse + joystick
               // modify to change MANUFACTURE and PRODUCT
            */
            //USB_SERIAL_HID_DB: null, // doesn't work, usb_undef.h
            // USB_KEYBOARDONLY: null,
            LAYOUT_US_ENGLISH: null,
            // __TEENSYBOARD:  null

            // NB  MANUFACTURER_NAME, MANUFACTURE_NAME_LEN
            //     PRODUCT_NAME, PRODUCT_NAME_LEN are found in
            //      teensy3/usb_desc.h.
            //     since F_CPU  >  20000000, we don't need to mod
            //      teensy3/usb_inst.cpp
        });

        this.AddSearchpaths( "Compile", 
        [
            "${TEENSYCORE}",
            "${TEENSYLIBS}" 
        ]);

        // arch specifc --------------------------------------------------

        let arch = ts.TargetArch;
        switch(ts.BuildVars.TEENSYBOARD)
        {
        case "TEENSY41": 
            this.Define(
            {
                "ARDUINO_TEENSY41": null,
                "__IMXRT1062__": null,
                "F_CPU": "600000000", /* up to 816000000 */
                "__IMXRT1062__": null,
            });
            this.AddFlags(this.GetRole(), 
            [
                "-mcpu=cortex-m7",
                "-mfpu=fpv5-d16",
                "-mfloat-abi=hard",
            ]);
            break;
        case "TEENSY40":
            // -DF_CPU=816000000 
            // -DF_CPU=600000000
            {
                let freq = "600000000";
                if(ts.BuildVars.TEENSYVARIANTS.indexOf("oc") != -1)
                    freq = "816000000";
                this.Define(
                {
                    "ARDUINO_TEENSY40": null,
                    "__IMXRT1062__": null,
                    "F_CPU": freq,
                    "__IMXRT1062__": null,
                });
                this.AddFlags(this.GetRole(), 
                [
                    "-mcpu=cortex-m7",
                    "-mfpu=fpv5-d16",
                    "-mfloat-abi=hard",
                ]);
            }
            break;
        case "TEENSYLC": // mcu=mkl26z64
            this.Define(
            {
                "ARDUINO_TEENSYLC": null,
                "__MKL26Z64__": null,
                "F_CPU": "48000000", // or 24
            });
            this.AddFlags(this.GetRole(), 
            [
                "--specs=nano.specs",
                "-mcpu=cortex-m0plus",
            ]);
            break;
        case "TEENSY31":
            this.Define(
            {
                "ARDUINO_TEENSY31": null,
                "F_CPU": "96000000",
                "__MK20DX256__": null,
            });
            break;
        }

    } // end constructor

    // need to configure all toolset tasks to agree with the 
    // current USBTYPE must be one of arduino's types (selected from Tools menu)
    ConfigureTaskSettings(task)
    {
        // gcc gets to configure the task     
        super.ConfigureTaskSettings(task); 
        let defaultDefs = {};
        console.assert(task.BuildVars.USBTYPE.length > 0);
        defaultDefs[task.BuildVars.USBTYPE]  = null;
        task.Define(defaultDefs);
    }
}

class CPP extends CC
{
    constructor(toolset)
    {
        super(toolset, "g++");
    }
}

class SC extends CC /* uses cc for assembing but using -x below */
{
    constructor(ts)
    {
        super(ts);
        this.AddFlags(this.GetRole(), [
            ["-x", "assembler-with-cpp"],
        ]);
    }
}

exports.CC = CC;
exports.CPP = CPP;
exports.SC = SC;
