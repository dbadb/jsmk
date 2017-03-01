var util = require("./util.js");

class Settings
{
    constructor(parent)
    {
        this.m_parent = parent;
        this.Environment = {}
        this.BuildVars = {}
    }

    Interpolate(str)
    {
        let result = util.Interpolate(str, this.BuildVars);
        return util.Interpolate(result, this.Environment);
    }

    MergeSettings(other)
    {
        this.MergeMaps(this.Environment, other.Environment);
        this.MergeMaps(this.BuildVars, other.BuildVars);
    }

    MergeMaps(target, map)
    {
        Object.assign(target, map); // nb: we could assign __proto__
        /*
        for(let attrname in map)
        {
            target[attrname] = map[attrname];
        }
        */
    }
};

exports.Settings = Settings;
