var util = require("./util.js");

class SettingsContainer
{
    constructor()
    {
        this.BuildVars = {}
        this.EnvMap = {}
        this.DefineMap = null;
        this.FlagList = null;
        this.FrameworkList = null;
        this.Searchpaths = {}; // a map of lists, common keys: "include", "link"
        this.LibList = null;
    }

    Interpolate(val)
    {
        if(typeof val === "string")
        {
            let result = util.Interpolate(val, this.BuildVars);
            if(result !== val)
                return result;
            else
                return util.Interpolate(val, this.EnvMap);
        }
        else
            return val;
    }

    MergeSettings(other)
    {
        if(other.EnvMap)
            this.mergeMaps(this.EnvMap, other.EnvMap);
        if(other.BuildVars)
            this.mergeMaps(this.BuildVars, other.BuildVars);
        if(other.DefineMap)
        {
            if(!this.DefineMap)
                this.DefineMap =  {};
            this.mergeMaps(this.DefineMap, other.DefineMap);
        }
        if(other.FlagList)
        {
            if(!this.FlagList)
                this.FlagList = [];
            this.mergeLists(this.FlagList, other.FlagList);
        }
        if(other.Searchpaths)
        {
            for(let okey of Object.keys(other.Searchpaths))
            {
                if(!this.Searchpaths[okey])
                    this.Searchpaths[okey] = [];
                this.mergeLists(this.Searchpaths[okey],
                                other.Searchpaths[okey]);
            }
        }
        if(other.FrameworkList)
        {
            if(!this.FrameworkList)
                this.FrameworkList = [];
            this.mergeLists(this.FrameworkList, other.FrameworkList);
        }
        if(other.LibList)
        {
            if(!this.LibList)
                this.LibList = [];
            this.mergeLists(this.LibList, other.LibList);
        }
    }

    SetEnv(key, val)
    {
        this.EnvMap[key] = this.Interpolate(val);
    }

    GetBuildVar(nm)
    {
        return this.BuildVars[nm];
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
        if(typeof val === "string")
            return util.Interpolate(val, this.BuildVars);
        else
            return val;
    }

    SetBuildVar(key, val)
    {
        this.BuildVars[key] = val;
    }

    SetVal(key, val)
    {
        this.BuildVars[key] = this.Interpolate(val);
    }

    SetBuildVars(map)
    {
        this.MergeBuildVars(map);
    }

    Define(obj)
    {
        if(!this.DefineMap)
            this.DefineMap = {}
        for(let key of Object.keys(obj))
        {
            let val = obj[key];
            if(val)
            {
                this.DefineMap[key] = this.Interpolate(val);
            }
            else
                this.DefineMap[key] = val;
        }
    }
    // return an arglist of defines that obey the provided syntax
    //  since Defines are a map, we substitute ${KEY} and ${VAL}
    GetDefines(syntax, syntaxNoVal)
    {
        let result = [];
        if(!this.DefineMap) return result;
        let slistV = syntax.split(" ");
        let slistNV = syntaxNoVal ? syntaxNoVal.split(" ") : slist;

        for(let key of Object.keys(this.DefineMap))
        {
            let val = this.DefineMap[key];
            let slist = slistV;
            if(val === null || val === undefined)
            {
                val = "";
                slist = slistNV;
            }
            else
            if(val === "")
                val = '""';
            let map = {
                        KEY: key,
                        VAL: val
                    };
            for(let s of slist)
            {
                let x = jsmk.Interpolate(s, map);
                result.push(x);
            }
        }
        return result;
    }

    GetDefine(key)
    {
        return this.DefineMap[key];
    }

    AddSearchpaths(type, dirs)
    {
        let Tool = require("./tool.js").Tool;
        if(!Tool.Role[type])
            jsmk.WARNING("AddSearchpaths: unconventional type " + type);
        if(!Array.isArray(dirs))
            dirs = [dirs];
        if(!this.Searchpaths[type])
            this.Searchpaths[type] = [];
        let paths = this.Searchpaths[type];
        for(let dir of dirs)
        {
            let val = this.Interpolate(dir);
            if(!jsmk.path.isAbsolute(val))
                val = jsmk.path.join(this.ProjectDir, val);
            if(-1 === paths.indexOf(dir))
                paths.push(val);
        }
    }

    GetSearchpaths(type, syntax)
    {
        let result;
        let paths = this.Searchpaths[type];
        if(!paths) paths = [];
        if(!syntax)
            result = paths;
        else
        {
            result = []
            let slist = syntax.split(" ");
            for(let i=0;i<paths.length;i++)
            {
                let val = this.Interpolate(paths[i]);
                for(let s of slist)
                    result.push(jsmk.Interpolate(s, {VAL: val}));
            }
        }
        return result;
    }

    AddFlags(flist)
    {
        if(!this.FlagList) this.FlagList = [];
        for(let f of flist)
        {
            let newflag = this.Interpolate(f);
            if(-1 === this.FlagList.indexOf(newflag))
                this.FlagList.push(this.Interpolate(f));
            else
                throw new Error("duplicate flag encountered " + newflag);
        }
    }
    // return an arglist of flagss that obey the provided syntax
    //  since Flags are a list, we substitute ${VAL}.
    GetFlags(syntax)
    {
        let result = [];
        if(!this.FlagList) return result;
        let slist = syntax.split(" ");
        for(let i=0;i<this.FlagList.length;i++)
        {
            let val = this.Interpolate(this.FlagList[i]);
            for(let s of slist)
                result.push(jsmk.Interpolate(s, {VAL: val}));
        }
        return result;
    }

    AddFrameworks(fws)
    {
        if(!Array.isArray(fws))
            fws = [fws];
        if(!this.FrameworksList)
            this.FrameworksList = [];
        for(let fw of fws)
        {
            if(-1 === this.FrameworksList.indexOf(fw))
                this.FrameworksList.push(fw);
        }
    }

    GetFrameworks()
    {
        return this.FrameworksList;
    }

    AddLibraries(libs)
    {
        if(!Array.isArray(libs))
            libs = [libs];
        if(!this.LibList) this.LibList = [];
        for(let lib of libs)
        {
            if(-1 === this.LibList.indexOf(lib))
                this.LibList.push(lib);
        }
    }

    GetLibs(syntax)
    {
        let result = [];
        if(!this.LibList) return result;
        let slist = syntax.split(" ");
        for(let i=0;i<this.LibList.length;i++)
        {
            let val = this.Interpolate(this.LibList[i]);
            for(let s of slist)
                result.push(jsmk.Interpolate(s, {VAL: val}));
        }
        return result;
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

    mergeLists(target, src)
    {
        for(let val of src)
        {
            if(-1 === target.indexOf(val))
                target.push(val);
        }
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
