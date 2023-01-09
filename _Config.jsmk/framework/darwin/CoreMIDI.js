//
// A Framework representing the target OS system-level
// support.
//
let Framework = jsmk.Require("framework").Framework;

class CoreMIDI extends Framework
{
    constructor(name, version)
    {
        super(name, version);
    }

    IsNative() { return true; }

    ConfigureTaskSettings(task)
    {
        // no-op
    }
}

exports.Framework = CoreMIDI;
