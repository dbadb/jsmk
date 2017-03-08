var SettingsContainer = require("./settingscontainer.js").SettingsContainer

// toolset maps toolset-selector string to instantiated tool
class Toolset extends SettingsContainer
{
    constructor(filenm, name)
    {
        super();
        this.m_origin = filenm;
        this.m_name = name;
        this.m_toolmap = {}
    }

    GetName()
    {
        return this.m_name;
    }

    MergeToolMap(map)
    {
        this.MergeMaps(this.m_toolmap, map);
    }

    GetTool(pat)
    {
        return this.m_toolmap[pat];
    }
}

exports.Toolset = Toolset;
