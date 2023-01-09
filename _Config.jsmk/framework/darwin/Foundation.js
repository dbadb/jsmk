//
// A Framework representing the target OS system-level
// support.
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Arch = jsmk.Require("toolset").Arch;

class Foundation extends Framework
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

exports.Framework = Foundation;
