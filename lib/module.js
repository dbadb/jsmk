/* global jsmk */
let SettingsContainer = require("./settingscontainer").SettingsContainer; 
let Task = require("./task").Task;
let Tool = require("./tool").Tool;

// A Module is a container of serial tasks.  The output of the last task is
// consider the output of the module.  Module references/dependencies are used
// in a few ways:
//  - module output(s) are often the input(s) of other modules' tasks
//  - modules can be used to configure other external tasks for
//    eg: Compile (defines, flags, searchpaths) and Link (flags, libs).
//     * NB: we require that defines be allowed to differ for module tasks 
//       and clients.
//
// Current Design:
//  * all settingscontainers have a ModuleList which can be
//    deep-copied into children.  Usually this is specified as
//    as module name, since module refs may not be available during
//    project loading. (ie: it might impose unreasonable project-tree
//     maintenance overhead).
//  * module consumes a special clientconfig setting that is *not*
//    inherited by child tasks.  This setting is used to configure
//    tasks "just-in-time".  Downside: this approach makes these configs
//    not overridable by tasks. Incidentally, the same is already true for 
//    just-in-time tool configurations. (ie: it's a bug and a feature).
//  * if a module depends on one module that itself, depends on another module,
//    should we allow those secondary projects to configure the primary? There
//    would be a clarity/convenience of expression. Consider:
//      libut depends on libjson
//      libapp depends on libut
//      app depends on libapp
//   If libapp module ref (by app) automatically includes libapp's module refs, 
//   then app subtasks would be minimally expressed but might get extra
//   settings.  Concrete example: libut

class Module extends SettingsContainer
{
    constructor(name, proj, config)
    {
        super();
        if(!config) config = {};
        config.Module = name;
        this.m_name = name;
        this.m_proj = proj;
        this.m_tasks = [];
        this.m_config = config;
        this.m_clientconfig = null;
        if(config.clientconfig)
        {
            this.m_clientconfig = new SettingsContainer();
            this.m_clientconfig.Configure(name+"_clientconfig", 
                                        "multirole",
                                        config.clientconfig);
            delete config.clientconfig;
        }
        this.MergeSettings(proj);
        this.Configure(name, null, config);
        this.m_builtDir = this.EvaluateBuildVar("BuiltDir");
    }

    GetName()
    {
        return this.m_name;
    }

    GetSummary()
    {
        let str = `${this.m_name} tasks: ${this.m_tasks.length}`;
        let modules = this.GetModules();
        if(modules && modules.length > 0)
            str = str + `, moddeps: ${modules.length}`;
        return str;
    }

    NewTask(name, rule, config)
    {
        let t;
        if(!config)
            config = {};
        if(!config.outputDir)
            config.outputDir = this.m_builtDir;
        t = new Task(name, rule, this, config);
        this.m_tasks.push(t);
        return t;
    }

    GetProject()
    {
        return this.m_proj;
    }

    GetWorkingDir()
    {
        return this.m_proj.ProjectDir;
    }

    GetOutputDir()
    {
        return this.m_builtDir;
    }

    GetInstallDir()
    {
        return this.EvaluateBuildVar("InstallDir");
    }

    GetPackageDir()
    {
        return this.EvaluateBuildVar("PackageDir");
    }

    GetRootDir()
    {
        return this.m_proj.GetRootDir();
    }

    GetDomainDir()
    {
        return this.m_proj.GetDomainDir();
    }

    // A module's outputs is defined as the outputs of the task marked
    // as such (TODO). Otherwise it's the outputs of the last task.
    GetOutputs()
    {
        let ntasks = this.m_tasks.length;
        if(ntasks > 0)
            return this.m_tasks[ntasks - 1].GetOutputs();
        else
            return null;
    }

    GetOutputLib()
    {
        let ntasks = this.m_tasks.length;
        if(ntasks > 0)
        {
            let lastTask = this.m_tasks[ntasks-1];
            if(lastTask.GetTool().GetRole() == Tool.Role.Archive)
                return lastTask.GetOutputs();
        }
        return null;
    }

    // GenerateWork invokes our ApplyModules on a task.
    //  This, then, invokes configureTask on all upstream
    //  module dependencies.
    *GenerateWork(stage)
    {
        if(stage === "clean")
        {
            let w = new Promise((resolve, reject) => 
            {
                jsmk.NOTICE("cleaning module " + this.m_builtDir);
                jsmk.file.rmtree(this.m_builtDir);
                resolve(this.m_builtDir);
            });
            w._name = this.m_name  + " clean";
            yield w;
            for(let i=0;i<this.m_tasks.length;i++)
            {
                let task = this.m_tasks[i];
                let outdir = task.GetOutputDir();
                if(outdir != this.m_builtDir)
                {
                    // ignore install phase tasks
                    if(task.GetActionStage() != "install")
                    {
                        if(!jsmk.path.isAbsolute(outdir))
                            outdir = jsmk.path.join(this.m_proj.ProjectDir, outdir);
                        for(let o of task.GetOutputs())
                        {
                            let fp = jsmk.path.join(outdir, jsmk.path.basename(o));
                            w = new Promise((resolve, reject) =>
                            {
                                jsmk.NOTICE("cleanup file " + fp);
                                jsmk.file.rmfile(fp);
                                resolve(fp);
                            });
                            yield w;
                        }
                    }
                }
            }
        }
        else
        {
            // jsmk.NOTICE(`mod: ${this.m_name} genwork for ${this.m_tasks.length} tasks`);
            for(let i=0;i<this.m_tasks.length;i++)
            {
                let task =  this.m_tasks[i];
                
                // First: allow upstream modules (self included) to configure
                //  the task at the 'moment' of workgen. NB: a task may 
                //  produce 0, 1 or many units of work.
                this.applyModules(task, true); 
                yield *task.GenerateWork(stage); 

                // Tasks are defined as processing serially.
                // Tasks can generate multiple, parallel work units.
                // Rather than require _Proj file authors to explicitly
                // decorate workers with  _blocking, we introduce a
                // no-op blocker to ensure synchronization.
                if(i <= this.m_tasks.length-1)
                {
                    let blocker = new Promise((resolve, reject) => {
                        resolve();
                    });
                    blocker._name = this.m_name + "_taskblock";
                    blocker._blocking = "before";
                    yield blocker;
                }
            }
        }
        return null;
    }

    // If a module has modules, those modules get a crack at configuring
    // a particular task. At compile-time this means setting up searchpaths.
    // At link time it means provide library references.
    applyModules(task, primary, breadcrumbs)
    {
        // jsmk.NOTICE(`${this.GetName()} applyModules to ${task.GetName()}: ${this.ModuleList}`);
        // should happen "just-in-time" whilst workgen is occuring
        //  and after build-proj-tree is complete.
        let nmodules = 0;
        let mods = [];
        if(this.m_clientconfig)
        {
            mods = this.m_clientconfig.GetModules();
            if(mods && mods.length > 0)
                jsmk.WARNING(`Module ${this.GetName()} has clientcfg module refs`);
        }

        if((!mods || !mods.length) && this.ModuleList && this.ModuleList.length > 0)
        {
            jsmk.DEBUG(`Module ${this.GetName()} has regular module refs`);
            mods = this.ModuleList;
        }

        let tmods = task.GetModules();
        if(tmods && tmods.length)
        {
            jsmk.TRACE(`Task ${task.GetName()} has module refs`);
            mods.push(...tmods);
        }

        if(mods && mods.length)
        {
            if(breadcrumbs === undefined)
                breadcrumbs = {};

            for(let m of mods)
            {
                if(typeof(m) === "string")
                {
                    if(breadcrumbs[m] !== undefined)
                        continue;
                    else
                        breadcrumbs[m] = m;
                    m = task.GetProject().FindModule(m);
                    if(!m)
                        throw(new Error("can't find module named " + m));
                }
                nmodules += m.applyModules(task, false, breadcrumbs); 
                m.configureTask(task);
            }
        }
        // primary gets last crack...
        if(primary)
            this.configureTask(task);
        return nmodules;
    }

    configureTask(t)
    {
        let role = t.GetTool().GetRole();
        let taskdir = t.GetWorkingDir();
        let mydir = this.GetWorkingDir();
        let modname = this.GetName();
        let configurer = this;
        if(this.m_clientconfig)
            configurer = this.m_clientconfig;

        if(this != t.GetModule())
        {
            jsmk.TRACE(`${t.GetModName()} configured by ${modname} as ` +
                `${role} ${this.m_clientconfig ? " (clientcfg)":""}`);
        }

        let sp = configurer.GetSearchPaths(role);
        if(sp && sp.length)
        {
            // searchpaths are often proj-relative pathnames.
            // we can either re-normalize to tasks' working dir or
            // make them absolute.
            let nsp = [];
            for(let i in sp)
            {
                let pp = sp[i];
                if(jsmk.path.isAbsolute(pp))
                    nsp.push(pp);
                else
                {
                    let ppa = jsmk.path.join(mydir, pp);
                    nsp.push(jsmk.path.relative(taskdir, ppa));
                }
            }
            sp = nsp;
            jsmk.TRACE(`${modname}/${role} searchpaths: ${sp}`);
            t.AddSearchPaths(role, sp);
        }

        let tflags = configurer.GetFlags(role);
        if(tflags && tflags.length)
        {
            // jsmk.WARNING(modname + " " + role + " flags:" + tflags);
            t.AddFlags(role, tflags);
        }
        switch(role)
        {
        case Tool.Role.Compile:
            // add searchpaths, defines(?), flags(?)
            t.Define(configurer.GetDefineMap());
            break;
        case Tool.Role.ArchiveDynamic:
        case Tool.Role.Link:
            {
                // NB: deps trigger firing of the rule at this point
                // they aren't the same as inputs (which Libs are).
                t.AddDeps(this.GetOutputLib()); 
                let deps = configurer.GetDeps() ;
                if(deps && deps.length) t.AddDeps(deps);

                let libs = configurer.GetLibs() || [];
                if(t.GetModule() != configurer)
                {
                    if(configurer.GetOutputs)
                        libs.push(...configurer.GetOutputs());
                    // else its a SettingsContainer
                }
                if(libs) t.AddLibs(libs);
                
                let frameworks = configurer.GetBuildVar("frameworks") || [];
                frameworks.push(...configurer.GetFrameworks());
                if(frameworks.length)
                    t.AddFrameworks(frameworks);
                let syslibs = configurer.GetBuildVar("syslibs");
                if(syslibs && syslibs.length)
                    t.AddLibs(syslibs);
                // jsmk.INFO(`${modname} deps:${deps} libs:${libs} syslibs: ${syslibs}`);
            }
            break;
        case Tool.Role.Archive:
        case Tool.Role.Copy:
        case Tool.Role.Install:
        case Tool.Role.Report:
        case Tool.Role.Extract:
        case Tool.Role.Deploy:
        case Tool.Role.Package:
        case Tool.Role.Reposit:
            // currently we don't need module-configuration for these roles
            break;
        default:
            jsmk.DEBUG(`Module ${t.GetModName()} not configured for ${role}`);
            break;
        }
    }
}

exports.Module = Module;
