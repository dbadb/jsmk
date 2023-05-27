/* global jsmk */
var util = require("./util.js");

// container of settings required to build a project:
//
//  inputs: are input files that are associated with a particular
//      task and are usually authored assets.  Since inputs aren't
//      usually composable, they aren't included in the SettingsContainer.
//      Tasks are responsible for combining inputs, Deps and Libs to produce
//      the collection of files referenced by the task. Tools can also
//      keep track of additional dependencies (files included by other files)
//      and trigger builds accordingly.
//
//  BuildVars are variables that can be referenced in project files
//      and will be just-in-time substituted according to current
//      build configuration (user, machine, target arch, etc).
//
//  EnvMap: are values that will be exported to any subprocesses
//      associated with a task.
//
//  DefineMap: used for preprocessor command-line defininition...
//      currently this is fairly cpp specific. But can be generalized
//      if needed.
//
//  FlagMap: a map of lists, key is tool.Role (aka: rule, ie: o->a).
//      this would signify flags for the archiving tool.
//
//  SearchPaths: used by tool associated with a role, to locate relative
//      file refs.  Commonly:  include and link paths. 
//      Key is role, Value is list.
//
//  ModuleList: is a list of module names that can be reached within
//      the build domain tree.  Modules are created by project-tree
//      loading and are used to configure clients tasks, eg: append
//      searchpaths and libs.
//
//  DepList: a list of inputs to any task that are both inputs to a
//      task and must be freshness-checked. DepList contributes to
//      ${SRCFILES} during tool-command substitution.
//
//  LibList: a list of files required by a linker.  Often modules will
//      configure/append this value, LibList isn't consulted to determine
//      when a particular build target is dirty and, as such, is most
//      useful for system libs (ie: -lm). LibList contributes to ${LIBS}
//      during tool-command substitution.
//
//  FrameworkList: like LibList, but for osx frameworks.
//
//  TriggerList: is a list of freshness-checkables that aren't intended
//      as a task input.  Touching a trigger should result in a rebuild.
//
//  Parameters: is a map of name/value 
//
class SettingsContainer
{
    constructor()
    {
        this.BuildVars = {};
        this.EnvMap = {};
        this.DefineMap = null;
        this.FlagMap = {};
        this.Searchpaths = {}; // a map of lists, common keys: "compile", "link"
        this.ModuleList = null;
        this.LibList = null;
        this.FrameworkList = null;
        this.DepList = null; // for inputs
        this.TriggerList = null; // for dirty check
        this.Parameters = null;
    }

    GetName() // overridden
    {
        return "unnamed SettingsContainer";
    }

    Configure(handle, role, config)
    {
        // we allow additional custom vals to be configured via _Proj
        // so we first delete non-custom configs
        // outputDir either comes from optional _Proj or module
        // all remaining unknown vars are deemed BuildVars
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
        if(config.frameworks)
        {
            this.AddFrameworks(config.frameworks);
            delete config.frameworks;
        }
        if(config.deps)
        {
            this.AddDeps(config.deps);
            delete config.deps;
        }
        if(config.depends)
        {
            this.AddDeps(config.depends);
            delete config.depends;
        }
        if(config.triggers)
        {
            this.AddTriggers(config.triggers);
            delete config.triggers;
        }
        if(config.parameters)
        {
            this.AddParameters(config.parameters);
            delete config.parameters;
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
        if(config.buildvars)
        {
            this.SetBuildVars(config.buildvars);
            delete config.buildvars;
        }
        if(config.flags)
        {
            if(Array.isArray(config.flags))
            {
                this.AddFlags(role, config.flags);
                // jsmk.WARNING(`deleting ${config.flags}`);
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
        if(other.FrameworkList)
        {
            if(!this.FrameworkList)
                this.FrameworkList = [];
            this.mergeLists(this.FrameworkList, other.FrameworkList);
        }
        if(other.DepList)
        {
            if(!this.DepList)
                this.DepList = [];
            this.mergeLists(this.DepList, other.DepList);
        }
        if(other.TriggerList)
        {
            if(!this.TriggerList)
                this.TriggerList = [];
            this.mergeLists(this.TriggerList, other.TriggerList);
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
                throw new Error(
                    `${this.GetName()} duplicate flag ${newflag}`);
                // jsmk.WARNING(`${this.GetName()} duplicate flag encountered ${newflag}`);
            }
        }
    }

    GetFlags(type, syntax)
    {
        // jsmk.NOTICe(`SC.getFlags ${type} ${syntax}`);
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
                // assume that flag is array and we want individually
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

    GetModules()
    {
        return this.ModuleList;
    }

    AddLibs(libs, extra)
    {
        if(extra) throw Error("invalid extra arg in Settings");
        if(!libs) return;
        if(!Array.isArray(libs))
            libs = [libs];
        if(!this.LibList) this.LibList = [];
        this.mergeLists(this.LibList, libs);
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

    AddFrameworks(fws, extra)
    {
        if(extra) throw Error("invalid extra arg in Settings");
        if(!fws) return;
        if(!Array.isArray(fws))
            fws = [fws];
        if(!this.FrameworkList) this.FrameworkList = [];
        this.mergeLists(this.FrameworkList, fws);
    }

    /**
     * GetFrameworks serves multiple masters.  tool_cli and task.
     * tool_cli kicks-in when a framework is marked as Native and
     * the associated tool has a special syntax for native frameworks 
     * (ie MacOS).  When invoked by task, no syntax is provided and
     * the framework configures the task directly.
     * @param {*} syntax 
     * @returns 
     */
    GetFrameworks(syntax)
    {
        if(!syntax) return this.FrameworkList || [];
        if(!this.FrameworkList) return [];
        // following is suspect in case of non-native frameworks.
        let result = [];
        let slist = syntax.split(" ");
        for(let fwnm of this.FrameworkList)
        {
            fwnm = this.Interpolate(fwnm);
            let fw = jsmk.GetFramework(fwnm, this.BuildVars); //vers in BuildVars
            if(fw && fw.IsNative())
            {
                for(let s of slist)
                    result.push(jsmk.Interpolate(s, {VAL: fwnm}));
            }
        }
        return result;
    }

    AddDependencies(deps)
    {
        this.AddDeps(deps);
    }

    AddDeps(deps)
    {
        if(!deps) return;
        if(!Array.isArray(deps))
            deps = [deps];
        if(this.DepList == null) 
            this.DepList = [];
        this.mergeLists(this.DepList, deps);
    }

    GetDeps()
    {
        return this.DepList;
    }

    GetDependencies()
    {
        return this.GetDeps();
    }

    AddTriggers(deps)
    {
        if(!Array.isArray(deps))
            deps = [deps];
        if(this.TriggerList == null) 
            this.TriggerList = [];
        this.mergeLists(this.TriggerList, deps);
    }

    AddParameters(map)
    {
        if(!this.Parameters)
            this.Parameters = {};
        this.mergeMaps(this.Parameters, map);
    }

    GetParameters()
    {
        return this.Parameters;
    }

    GetTriggers()
    {
        return this.TriggerList;
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
            if(tval === undefined || tval === null)
                target[attrname] = map[attrname];
            else
            if(!tval.constructor)
            {
                jsmk.WARNING("stomping on unknown " + attrname);
            }
            else
            {
                let ttype = tval.constructor.name;
                switch(ttype)
                {
                case "Array":
                    // warning: some arrays may not want to be concatenated
                    {
                        let mval = map[attrname];
                        if(tval !== mval)
                            target[attrname] = tval.concat(mval);
                    }
                    break;
                case "Object":
                    try
                    {
                        // smoosh maps together
                        Object.assign(tval, map[attrname]);
                    }
                    catch(err)
                    {
                        jsmk.ERROR(`mergeSettings: ${attrname} ${tval}`);
                        throw(err);
                    }
                    break;
                case "String":
                case "Number":
                case "Function":
                    target[attrname] = map[attrname];
                    break;
                default:
                    jsmk.DEBUG(`overriding ${attrname} (${ttype}})`);
                    target[attrname] = map[attrname];
                    break;
                }
            }
        }
    }
}

exports.SettingsContainer = SettingsContainer;
