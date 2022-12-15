/* global jsmk */
let GCC = require("../gcc.js").GCC;

// Here we define two classes,  CC and CPP..
//
class CC extends GCC
{
    constructor(ts, invoc)
    {
        if(!invoc)
            invoc = "gcc";
        let exefile = invoc;  // for cross compile, may have preamble
        let arg0 = jsmk.path.resolveExeFile(exefile,
                                    ts.BuildVars.LINUX_TOOLCHAIN);
        if(!arg0) throw new Error(`Can't resolve linux ${exefile}`);
        super(ts, `linux/${invoc}`, arg0);

        this.Define({});

        this.AddFlags(this.GetRole(), [
                "-c",
                "-Wall",
                "-fPIC",
            ]);

        this.AddSearchpaths( "Compile", []);
    } // end constructor

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        // per-task settings go here
    }
}

class CPP extends CC
{
    constructor(toolset)
    {
        super(toolset, "g++"); // super is gcc
        this.AddFlags(this.GetRole(), [
            // these are more about code-base
            // "-fno-rtti", 
            // "-felide-constructors",
        ]);
    }
}

exports.CC = CC;
exports.CPP = CPP;
