var util = require("./util.js");

class SettingsContainer
{
    constructor()
    {
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

    MergeMaps(target, map) // useful to subclasses etc for non-member map merges
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

exports.SettingsContainer = SettingsContainer;
