/* global jsmk */
var util = require("./util.js");

class SettingsContainer
{
    constructor()
    {
        this.BuildVars = {};
        this.EnvMap = {};
        this.DefineMap = null;
        this.FlagMap = {};
        this.FrameworkList = null;
        this.Searchpaths = {}; // a map of lists, common keys: "compile", "link"
        this.LibList = null;
        this.DepFiles = null;
        this.ModuleList = null;
    }

    Configure(handle, role, config, rootproj)
    {
        // we allow additional custom vals to be configured via _Proj
        // so we first delete non-custom configs
        // outputDir either comes from optional _Proj or module
        if(config.modules)
        {
            this.AddModules(config.modules);
            delete config.modules;
        }
        if(config.libs)
        {
            this.AddLibs(config.libs);
            delete config.libs;
        }
        if(config.outputs)
        {
            jsmk.WARNING("settingscontainer ignoring outputs");
            delete config.outputs;
        }
        if(config.outputDir)
        {
            jsmk.WARNING("settingscontainer ignoring outputdir");
            delete config.outputDir;
        }
        if(config.define)
        {
            this.Define(config.define);
            delete config.define;
        }
        if(config.searchpaths)
        {
            if(Array.isArray(config.searchpaths))
            {
                this.AddSearchpaths(role, config.searchpaths);
            }
            else
            {
                for(let role of Object.keys(config.searchpaths))
                {
                   this.AddSearchpaths(role, config.searchpaths[role]); 
                }
            }
            delete config.searchpaths;
        }
        if(config.flags)
        {
            if(Array.isArray(config.flags))
            {
                this.AddFlags(role, config.flags);
                delete config.flags;
            }
            else
            {
                for(let key in config.flags)
                {
                    this.AddFlags(key, config.flags[key]);
                }
            }
        }
        if(config.frameworks)
        {
            this.AddFrameworks(config.frameworks);
            delete config.frameworks;
        }
        if(config.toolconfig) // unused?
        {
            jsmk.NOTICE(`${handle} ignoring a toolconfig`);
            delete config.toolconfig;
        }
        // we've pulled all special values out of config... We now
        // interpret the rest as buildvars.
        this.MergeBuildVars(config); // tool&module::MergeSettings invoked above
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

    MergeBuildVars(map)
    {
        if(!map) return;
        this.mergeMaps(this.BuildVars, map);
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
        if(other.FlagMap)
        {
            for(let okey of Object.keys(other.FlagMap))
            {
                if(!this.FlagMap[okey])
                    this.FlagMap[okey] = [];
                this.mergeLists(this.FlagMap[okey],
                                other.FlagMap[okey]);
            }
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
        if(other.ModuleList)
        {
            if(!this.ModuleList)
                this.ModuleList = [];
            this.mergeLists(this.ModuleList, other.ModuleList);
        }
        if(other.LibList)
        {
            if(!this.LibList)
                this.LibList = [];
            this.mergeLists(this.LibList, other.LibList);
        }
        if(other.DepFiles)
        {
            if(!this.DepFiles)
                this.DepFiles = [];
            this.mergeLists(this.DepFiles, other.DepFiles);
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
            this.DefineMap = {};
        for(let key of Object.keys(obj))
        {
            let val = obj[key];
            if(val)
                this.DefineMap[key] = this.Interpolate(val);
            else
                this.DefineMap[key] = val;
        }
    }

    GetDefineMap()
    {
        return this.DefineMap ? this.DefineMap : {};
    }

    GetDefine(key)
    {
        return this.DefineMap ? this.DefineMap[key] : undefined;
    }

    // return an arglist of defines that obey the provided syntax
    //  since Defines are a map, we substitute ${KEY}, ${VAL}
    GetDefines(syntax, syntaxNoVal)
    {
        let result = [];
        if(!this.DefineMap) return result;
        let slistV = syntax.split(" ");
        let slistNV = syntaxNoVal ? syntaxNoVal.split(" ") : slistV;

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
                val = "\"\"";
            let map = {
                KEY: key,
                VAL: val,
            };
            for(let s of slist)
            {
                let x = jsmk.Interpolate(s, map);
                result.push(x);
            }
        }
        return result;
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
            // if(!jsmk.path.isAbsolute(val))
            //  val = jsmk.path.join(this.ProjectDir, val);
            if(-1 === paths.indexOf(dir))
                paths.push(val);
        }
    }

    AddSearchPaths(type, dirs)
    {
        return this.AddSearchpaths(type, dirs);
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
            result = [];
            let slist = syntax.split(" ");
            for(let i=0;i<paths.length;i++)
            {
                let val = this.Interpolate(paths[i]);
                let map = {
                    VAL: val,
                };
                for(let s of slist)
                {
                    result.push(jsmk.Interpolate(s, map));
                }
            }
        }
        return result;
    }

    GetSearchPaths(type, syntax)
    {
        return this.GetSearchpaths(type, syntax);
    }

    AddFlags(type, flist)
    {
        if(this.FlagMap[type] === undefined)
            this.FlagMap[type] = [];
        let myflags = this.FlagMap[type];
        for(let f of flist)
        {
            let newflag = this.Interpolate(f);
            if(-1 === myflags.indexOf(newflag))
                myflags.push(this.Interpolate(f));
            else
            {
                //throw new Error("duplicate flag encountered " + newflag);
                jsmk.WARNING("duplicate flag encountered " + newflag);
            }
        }
    }

    GetFlags(type, syntax)
    {
        let result = [];
        if(!this.FlagMap[type]) return result;
        let myflags = this.FlagMap[type];
        if(!syntax) return myflags;
        let slist = syntax.split(" ");
        for(let i=0;i<myflags.length;i++)
        {
            let f = myflags[i];
            if(typeof(f) === "string")
            {
                let val = this.Interpolate(f);
                for(let s of slist)
                    result.push(jsmk.Interpolate(s, {VAL: val}));
            }
            else
            {
                // assume that flag is array and we want indvidually
                // tokenized args
                for(let i=0;i<f.length;i++)
                {
                    let val = this.Interpolate(f[i]);
                    for(let s of slist)
                        result.push(jsmk.Interpolate(s, {VAL: val}));
                }
            }
        }
        return result;
    }

    AddFrameworks(fws)
    {
        if(!Array.isArray(fws))
            fws = [fws];
        if(!this.FrameworkList)
            this.FrameworkList = [];
        for(let fw of fws)
        {
            if(-1 === this.FrameworkList.indexOf(fw))
                this.FrameworkList.push(fw);
        }
    }

    GetFrameworks()
    {
        return this.FrameworkList;
    }

    ApplyModules(task)
    {
        // should happen "just-in-time" whilst workgen is occuring
        //  and after build-proj-tree is complete.
        for(let i in this.ModuleList)
        {
            let m = this.ModuleList[i];
            if(typeof(m) === "string")
            {
                m = task.GetProject().FindModule(m);
                if(!m)
                    throw(new Error("can't find module named " + m));
            }
            m.ApplyModules(task); // XXX: worry about circular refs?
            m.ConfigureTask(task);
        }
    }

    AddModules(modules)
    {
        // jsmk.NOTICE(`${this.GetName()} adding modules ${modules}`);
        if(!Array.isArray(modules))
            modules = [modules]; // may be module names (for forward refs)

        if(!this.ModuleList) this.ModuleList = [];
        for(let mod of modules)
        {
            if(-1 === this.ModuleList.indexOf(mod))
                this.ModuleList.push(mod);
        }
    }

    AddLibs(libs, depends)
    {
        if(!Array.isArray(libs))
            libs = [libs];
        if(!this.LibList) this.LibList = [];
        if(depends && !this.DepList) this.DepList = [];
        for(let lib of libs)
        {
            if(-1 === this.LibList.indexOf(lib))
            {
                this.LibList.push(lib);
            }
            if(depends && -1 == this.DepList.indexOf(lib))
            {
                this.DepList.push(lib);
            }
        }
    }

    AddLibraries(libs, depends)
    {
        this.AddLibs(libs, depends);
    }

    GetLibs(syntax)
    {
        let result = [];
        if(!this.LibList) return result;
        if(!syntax) return this.LibList;
        let slist = syntax.split(" ");
        for(let i=0;i<this.LibList.length;i++)
        {
            let val = this.Interpolate(this.LibList[i]);
            for(let s of slist)
                result.push(jsmk.Interpolate(s, {VAL: val}));
        }
        return result;
    }

    GetDependencies()
    {
        return this.DepList;
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
                if(Array.isArray(tval))
                {
                    // warning: some arrays may not want to be concatenated
                    let mval = map[attrname];
                    if(tval !== mval)
                        target[attrname] = tval.concat(mval);
                }
                else
                if(tval != null && typeof tval === "object")
                {
                    try
                    {
                        Object.assign(tval, map[attrname]);
                    }
                    catch(err)
                    {
                        jsmk.ERROR(`mergeSettings: ${attrname} ${tval}`);
                        throw(err);
                    }
                }
                else
                    target[attrname] = map[attrname];
            }
        }
    }
}

exports.SettingsContainer = SettingsContainer;
