Settings = require("settings").Settings;

// toolset maps toolset-selector string to instantiated tool
class Toolset extends Settings
{
    constructor(filenm, name)
    {
        super.constructor();
        this.Origin = filenm;
        this.Name = name;
        this.ToolMap = {}
        this.Settings = Settings();
    }

    GetTool(pat)
    {
        return this.ToolMap[pat];
    }


}
