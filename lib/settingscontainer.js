var util = require("./util.js");

class SettingsContainer
{
    constructor()
    {
        this.Environment = {}
        this.BuildVars = {}
    }

    EvaluateBuildVar(nm)
    {
        let val = this.BuildVars[nm];
        if(val === undefined)
        {
            jsmk.WARNING("EvaluateBuildVar failed for " + nm);
            return nm;
        }
        else
            return util.Interpolate(val, this.BuildVars);
    }

    Interpolate(str)
    {
        let result = util.Interpolate(str, this.BuildVars);
        return util.Interpolate(result, this.Environment);
    }

    MergeSettings(other)
    {
        this.mergeMaps(this.Environment, other.Environment);
        this.mergeMaps(this.BuildVars, other.BuildVars);
    }

    MergeBuildVars(map)
    {
        if(!map) return;
        this.mergeMaps(this.BuildVars, map);
    }

    MergeMap(name, map)
    {
        if(this[name] === undefined)
            jsmk.ERROR("SettingsContainer.MergeMap unknown map: " + name);
        this.mergeMaps(this[name], map);
    }

    mergeMaps(target, map) // useful to subclasses etc for non-member map merges
    {
        // NB: certain entries may require special behavior:
        //      PATH: concatenate
        //      includes: concatenate
        //   so type of entry may determine concatenation behavior
        // Object.assign(target, map); /* this just replaces conflicts */

        for(let attrname of Object.keys(map))
        {
            let tval = target[attrname];
            if(tval === undefined)
                target[attrname] = map[attrname];
            else
            {
                if(Array.isArray(tval) || attrname === "PATH")
                    tval.append(map[attrname]);
                else
                if(typeof tval === "object")
                    Object.assign(tval, map[attrname]);
                else
                    target[attrname] = map[attrname];
            }
        }
    }
};

exports.SettingsContainer = SettingsContainer;
