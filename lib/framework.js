var SettingsContainer = require("./settingscontainer.js").SettingsContainer;


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

    ConfigureTaskSettings(task)
    {
        // task's tool's Role might apply different settings.
        task.MergeSettings(this);
    }
}

exports.Framework = Framework;
