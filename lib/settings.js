util = require("./util.js");

class Settings
{
    constructor()
    {
        this.Environment = {}
        this.BuildVars = {}
    }

    Interpolate(str)
    {
        let result = util.Interpolate(str, this.BuildVars);
        result = util.Interpolate(str, this.Environment);
        return result;
    }

    MergeSettings(other)
    {
        this.MergeMaps(this.Environment, other.Environment);
        this.MergeMaps(this.BuildVars, other.BuildVars);
    }

    MergeMaps(target, map)
    {
        for(let attrname in map)
        {
            target[attrname] = map[attrname];
        }
    }
};

exports.Settings = Settings;
