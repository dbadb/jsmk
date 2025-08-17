var SettingsContainer = require("./settingscontainer.js").SettingsContainer;

// A Framework is a collection of pre-built headers & libraries, that
// are versioned and located independent of the basic os libraries and headers.
// This is analogous to the npm, nuget etc. packages.
// NB: this idea overlaps with MacOS-specific frameworks be careful
//  with confusion.  The `clang` tool on MacOS has special CLI
//  syntax for native frameworks, so we distinguish between native
//  and normal/portable frameworks.  OpenSSL is an example of portable
//  non-native framework what includes a pile of headers and libs.
//
// Subclasses should override ConfigureTaskSettings, then tailor
// the task-configuration according to the Role of its associated 
// tool.
class Framework extends SettingsContainer
{
    constructor(fwname, fwvers)
    {
        super();
        this.m_name = fwname;
        this.m_version = fwvers;
    }

    GetName()
    {
        return this.m_name;
    }

    GetVersion()
    {
        return this.m_version;
    }

    IsNative() // part of OS?
    {
        return false;
    }

    ConfigureProject(proj, how) // mostly a no-op, used by CEF
    {
    }

    ConfigureTaskSettings(task)
    {
        // task's tool's Role might affect settings. Which
        // is why overriding this method is suggested.
        task.MergeSettings(this);
    }
}

exports.Framework = Framework;
