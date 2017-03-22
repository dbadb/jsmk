var SettingsContainer = require("./settingscontainer.js").SettingsContainer;


class Framework extends SettingsContainer
{
    constructor(fwname, fwvers)
    {
        super();
        this.fwName = fwname;
        this.fwVers = fwvers;
    }

    ConfigureTaskSettings(task)
    {
        task.MergeSettings(this);
    }
}

exports.Framework = Framework;
