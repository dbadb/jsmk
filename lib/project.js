/* global jsmk */
//
//  A Project represents a tree of buildable components.
//   - can contain
//      -- Projects and/or Modules.
//      -- BuildVariables
//          - used for pattern substitution
//          - embody parameters to child Projects and Modules
//
let SettingsContainer = require("./settingscontainer").SettingsContainer;
let Module = require("./module").Module;

exports.NewProjectTree = function(toolset, policy)
{
    // NB: instantiating the root, automatically loads subprojects recursively.
    let projTree = new Project("Root", null, policy,
                        {
                            ProjectDir: policy.RootDir
                        });

    jsmk.DEBUG("ProjectTreeBegin {");
    let visitor = function(proj, level, w) {
                if(w === "before")
                {
                    let str = "  ".repeat(level+1) + proj.Name;
                    let xstr;
                    if(proj.IsDomainController())
                    {
                        str = str + " - Domain " + proj.GetDomainName();
                        xstr = "  ".repeat(level+2) + "modMap: " + 
                            Object.keys(proj.GetDomain().moduleMap);
                    }

                    if(proj.m_barrier)
                        str = str + ` - ${proj.m_barrier} barrier`;
                    jsmk.DEBUG(str);
                    if(xstr)
                        jsmk.DEBUG(xstr);
                }
            };
    projTree.TraverseBelow(visitor, 0);
    jsmk.DEBUG("} ProjectTreeEnd");

    return projTree;
};

class ProjDomain
{
    constructor(name, proj, parent, toolsetConstraints)
    {
        jsmk.DEBUG(`Domain ${name} established ------------------`);
        this.name = name;
        this.controller = proj;
        this.parent = parent;
        if(!parent)
            this.rootProj = proj;
        else
            this.rootProj = parent.rootProj;
        this.toolsetConstraints = toolsetConstraints;
        this.moduleMap = {};
        this.subDomains = [];

    }

    AddSubDomain(d)
    {
        // jsmk.DEBUG(`${this.name} addSubDomain ${d.name}`);
        this.subDomains.push(d);
    }

    AddModule(m)
    {
        let mnm = m.GetName();
        if(this.moduleMap[mnm])
            jsmk.WARNING("conflicting module name " + mnm);
        else
            this.moduleMap[mnm] = m;
    }

    FindModule(nm)
    {
        let m = this.moduleMap[nm];
        if(!m)
        {
            for(let i in this.subDomains)
            {
                m = this.subDomains[i].FindModule(nm);
                if(m) 
                    break;
            }
        }
        return m;
    }

    AcceptsToolset(toolset)
    {
        let result = true;
        if(toolset && this.toolsetConstraints)
        {
            result = this.toolsetConstraints.test(toolset.GetHandle());
        }
        return result;
    }
}

class Project extends SettingsContainer
{
    // name is project name and default subdir (config.ProjectDir overrides)
    // parent is parent project, unless root where it's the policy.
    // config:
    //      ProjectDir
    constructor(name, parent, policy, config)
    {
        super();
        config = config ? config : {};
        this.Name = name;
        this.m_policy = policy;
        this.m_parent = parent;
        this.m_children = [];
        this.m_modules = [];
        this.m_domain = null;
        if(!parent)
        {
            this.m_domain = new ProjDomain("Root", this);
        }
        else
            this.m_domain = parent.m_domain;

        if(config && config.ProjectDir === this.m_policy.RootDir)
        {
            this.ProjectDir = this.m_policy.RootDir; // presumably fully qualified
            this.ProjectFilePath = jsmk.path.join(this.ProjectDir,
                                                  this.m_policy.RootFile);
        }
        else
        {
            if(config && config.ProjectDir)
                this.ProjectDir = config.ProjectDir;
            else
                this.ProjectDir = this.Name;
            if(!jsmk.path.isAbsolute(this.ProjectDir))
                this.ProjectDir = jsmk.path.join(this.m_parent.ProjectDir,
                                                 this.ProjectDir);
            this.ProjectFilePath = jsmk.path.join(this.ProjectDir,
                                                  this.m_policy.ProjFile);
        }
        if(config && config.barrier)
            this.EstablishBarrier(config.barrier);

        if(this.m_parent)
            this.MergeSettings(this.m_parent);

        if(!jsmk.path.exists(this.ProjectFilePath) && !config.init)
        {
            // check for root for cross-domain references..
            let bail = true;
            if(parent)
            {
                let rootpath = jsmk.path.join(this.ProjectDir,
                                              this.m_policy.RootFile);
                if(jsmk.path.exists(rootpath))
                {
                    bail = false;
                    this.ProjectFilePath = rootpath;
                }
            }
            if(bail)
                throw this.Name + " can't find project file:" + this.ProjectFilePath;
        }
        config.ProjectDir = this.ProjectDir;
        this.MergeBuildVars(config);
        this.m_policy.ConfigureProjSettings(this); // template flattening

        // now we load / init the new project, either by
        //  hook: ie config.init,  or by
        //  crook:  ie a on-disk _Proj file.
        //  following may throw
        let lastProj = global.Project;
        global.Project = this;
        try
        {
            process.chdir(this.ProjectDir);
        }
        catch (e)
        {
            throw(new Error("Can't chdir to " + this.ProjectDir));
        }
        if(config.init) // functional configuration of this project
        {
            jsmk.DEBUG(this.ProjectDir + " init (functional)");
            config.init(this);
        }
        else
        {
            jsmk.DEBUG("loading: " + this.ProjectFilePath);
            delete require.cache[require.resolve(this.ProjectFilePath)];
            try
            {
                require(this.ProjectFilePath);
            }
            catch (e)
            {
                if(e !== "ignoreToolset")
                    throw(e);
            }
        }

        global.Project = lastProj;
        if(lastProj)
            process.chdir(lastProj.ProjectDir);
    }

    GetName()
    {
        return this.Name;
    }

    IsRoot()
    {
        if(this.ProjectFilePath.indexOf(this.m_policy.RootFile) !== -1)
            return true;
        else
            return this.m_parent ?  false : true;
    }

    GetRootDir()
    {
       return this.m_domain.rootProj.ProjectDir; 
    }

    IsDomainController()
    {
        return this.m_domain.controller === this;
    }

    GetDomain()
    {
        return this.m_domain;
    }

    GetDomainDir()
    {
        return this.m_domain.controller.ProjectDir;
    }

    GetDomainName()
    {
        return this.m_domain.name;
    }

    EstablishDomain(name, toolsetConstraints)
    {
        let old = this.m_domain;
        this.m_domain = new ProjDomain(name, this, this.m_domain,
                                       toolsetConstraints);
        if(old)
            old.AddSubDomain(this.m_domain);
        if(!this.AcceptsToolset(jsmk.GetActiveToolset()))
        {
            throw "ignoreToolset";
        }
        this.m_policy.ConfigureProjSettings(this); // template flattening
    }

    GetBarrier()
    {
        return this.m_barrier;
    }

    EstablishBarrier(typ)
    {
        if(typ !== "before" && typ !== "after")
            throw new Error("Only before barriers currently supported");
        this.m_barrier = typ;
    }

    AcceptsToolset(toolset)
    {
        return this.m_domain.AcceptsToolset(toolset);
    }

    AddSubDirs(dirs)
    {
        if(dirs == undefined)
            dirs = jsmk.path.getsubdirs(this.ProjectDir);
        for(let i in dirs)
        {
            this.NewProject(dirs[i]);
        }
    }
    
    // following methods are avaiable to Project files.
    NewProject(name, config)
    {
        let newproj;
        if(this.AcceptsToolset(jsmk.GetActiveToolset()))
        {
            newproj = new Project(name, this, this.m_policy, config);
            this.m_children.push(newproj);
        }
        else
        {
            jsmk.DEBUG(this.GetName() + " not loading subproject: " + name +
                        " (toolset rejected)");
        }
        return newproj;
    }

    FindProjectNamed(name)
    {
        return this.TraverseBelow(function(proj) {
            if(name === proj.Name)
            {
                throw proj; // communicate proj to TraverBelow
            }
        });
    }

    // convenience method for _Proj file authors
    Glob(pat)
    {
        return jsmk.path.glob(pat);
    }

    NewModule(name, config, rootproj)
    {
        let mm = this.findSiblingModule(name);
        if(mm)
            jsmk.WARNING(`Module name reused ${this.Name}/${name}`);

        let m = new Module(name, this, config, rootproj);
        this.m_domain.AddModule(m);
        this.m_modules.push(m);
        return m;
    }

    findSiblingModule(name)
    {
        for(let m of this.m_modules)
        {
            if(m.GetName() === name)
                return m;
        }
        return null;
    }

    FindModule(mnm)
    {
        let mod = this.m_domain.FindModule(mnm);
        if(!mod)
        {
            let msg = `${this.GetDomainName()} can't find module ${mnm}`;
            jsmk.WARNING(msg);
            throw(msg);
        }
        return mod;
    }

    FindModuleOutputs(mnm)
    {
        let m = this.FindModule(mnm);
        if(m)
            return m.GetOutputs();
        else
            return undefined;
    }

    *GenerateWork(stage) // returns a promise on each iteration
    {
        for(let m of this.m_modules)
        {
            let w = m.GenerateWork(stage);
            yield *w;
        }
        return null;
    }

    *IterateProjects(style, visitor)
    {
        if(visitor && visitor(this, "before") === "break")
            return;

        if(style === "breadthfirst") yield this;
        for(let p of this.m_children)
        {
            yield *p.IterateProjects(style, visitor);
        }
        if(style === "depthfirst") yield this;
        if(visitor && visitor(this, "after") === "break") // break has no effect
            return;
    }

    // TraverseBelow is a public entrypoint that recursively
    //  invokes the 'private' version.  Visitors can "throw"
    //  errors to short-circuit traverse, Such 'errors'
    //  are returned to the top-level caller.
    TraverseBelow(visitor)
    {
        try
        {
            this.traverseBelow(visitor, 0);
        }
        catch (e)
        {
            return e;
        }
        return null;
    }

    traverseBelow(visitor, level)
    {
        visitor(this, level, "before");
        for(let i=0;i<this.m_children.length;i++)
        {
            this.m_children[i].traverseBelow(visitor, level+1);
        }
        visitor(this, level, "after");
    }

    // Constructs a 2-level inline project tree useful
    // for typical open-source projects. Inputs are
    // a projlist database (list of projects)... Set barrier
    // to "before" or "after" to express a gross dependency.
    BuildInlineCppProjects(basename, projlist, barrier)
    {
        let projdir = this.ProjectDir;
        let rootproj = this;
        let newProj = this.NewProject(basename, {
            ProjectDir: projdir, // libs is a 'virtual' dir
            barrier: barrier,
            init: function(subProj) {
                let excludeFiles = function(srcfiles, excludes) {
                    for(let i in excludes)
                    {
                        let ii = srcfiles.indexOf(excludes[i]);
                        if(ii != -1)
                            srcfiles.splice(ii, 1);
                    }
                };
                let configureTask = function(task, modules)
                {
                    if(modules)
                    {
                        for(let i in modules)
                        {
                            modules[i].ConfigureTask(task);
                        }
                    }
                };
                for(let i in projlist)
                {
                    let projdir = projlist[i].dir;
                    let projnm;
                    if(projlist[i].name)
                        projnm = projlist[i].name;
                    else
                        projnm = jsmk.path.tail(projdir);
                    let src = projlist[i].src;
                    let inc = projlist[i].inc;
                    let defs = projlist[i].defs;
                    let cflags = projlist[i].flags;
                    let ldflags = projlist[i].ldflags;
                    // modules: jsmk modules used to configure this module
                    //         used for apps and compile/archives
                    // libs: inputs (dependencies), 
                    // syslibs: are libs which don't change
                    // clientconfig: { // when archive configures a client
                    //      searchpaths:  {
                    //      },
                    //      libs: {
                    //      }
                    // }
                    let modules = projlist[i].modules;
                    let libs = projlist[i].libs;
                    let syslibs = projlist[i].syslibs;
                    let clientconfig = projlist[i].clientconfig;
                    let isApp = libs ? true : (syslibs ? true : false);

                    subProj.NewProject(projnm, {
                        ProjectDir: projdir,
                        init: function(subProj) {
                            let m = subProj.NewModule(projnm, clientconfig, rootproj);
                            let archiveObjs = [], appInputs = [];
                            if(src.cpp)
                            {
                                let srcfiles = [];
                                if(typeof src.cpp == "string")
                                    src.cpp = [src.cpp];
                                for(let i in src.cpp)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.cpp[i]));
                                excludeFiles(srcfiles, src.exclude);
                                if(srcfiles.length)
                                {
                                    let tcpp = m.NewTask("compile_cpp", "cpp->o", {
                                        inputs: srcfiles,
                                        flags: cflags,
                                        searchpaths: inc,
                                        define: defs,
                                    });
                                    configureTask(tcpp, modules);
                                    archiveObjs = archiveObjs.concat(tcpp.GetOutputs());
                                }
                            }
                            if(src.c)
                            {
                                let srcfiles = [];
                                if(typeof src.c == "string")
                                    src.c == [src.c];
                                for(let i in src.c)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.c[i]));
                                excludeFiles(srcfiles, src.exclude);
                                if(srcfiles.length)
                                {
                                    let tc = m.NewTask("compile_c", "c->o", {
                                        inputs: srcfiles,
                                        flags: cflags,
                                        searchpaths: inc,
                                        define: defs,
                                    });
                                    configureTask(tc, modules);
                                    archiveObjs = archiveObjs.concat(tc.GetOutputs());
                                }
                            }
                            if(archiveObjs.length > 0)
                            {
                                let libnm;
                                if(isApp) 
                                    libnm = "lib" + projnm;
                                else
                                    libnm = projnm;
                                let tlib = m.NewTask(libnm, "o->a", {
                                    inputs: archiveObjs
                                });
                                configureTask(tlib, modules);
                                if(isApp)
                                    appInputs = tlib.GetOutputs();
                            }
                            else
                            if(!src.appcpp && !src.appc)
                                jsmk.WARNING(`${projnm} has no archiveable objects`);

                            if(src.appcpp)
                            {
                                let srcfiles = [];
                                if(typeof src.appcpp == "string")
                                    src.appcpp = [src.appcpp];
                                for(let i in src.appcpp)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.appcpp[i]));
                                excludeFiles(srcfiles, src.exclude);
                                if(srcfiles.length)
                                {
                                    let tcpp = m.NewTask("compile_appcpp", "cpp->o", {
                                        inputs: srcfiles,
                                        flags: cflags,
                                        searchpaths: inc,
                                        define: defs,
                                    });
                                    configureTask(tcpp, modules);
                                    appInputs = appInputs.concat(tcpp.GetOutputs());
                                }
                            }
                            if(src.appc)
                            {
                                let srcfiles = [];
                                if(typeof src.appc == "string")
                                    src.appc = [src.appc];
                                for(let i in src.appc)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.appc[i]));
                                excludeFiles(srcfiles, src.exclude);
                                if(srcfiles.length)
                                {
                                    let tc = m.NewTask("compile_appc", "c->o", {
                                        inputs: srcfiles,
                                        flags: cflags,
                                        searchpaths: inc,
                                        define: defs,
                                    });
                                    configureTask(tc, modules);
                                    appInputs = appInputs.concat(tc.GetOutputs());
                                }
                            }
                            if(appInputs.length > 0)
                            {
                                let inputs = appInputs;
                                for(let i in libs)
                                    inputs = inputs.concat(rootproj.FindModuleOutputs(libs[i]));
                                let tapp = m.NewTask(projnm, "cpp.o->exe", {
                                    inputs: inputs,
                                    libs: syslibs,
                                    flags: ldflags,
                                    // apps don't configclients, right?
                                });
                                configureTask(tapp, modules);
                            }
                        }
                    });
                }
            }
        });
        return newProj;
    }
}

