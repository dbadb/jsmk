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
    return projTree;
};

exports.DumpProjectTree = function(projTree, level="DEBUG")
{
    let logfn = jsmk[level];
    logfn("ProjectTreeBegin {");
    let visitor = function(proj, level, w)
    {
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
            str += ` ${proj.ProjectDir}`;
            logfn(str);
            if(xstr)
                logfn(xstr);
        }
    };
    projTree.TraverseBelow(visitor, 0);
    logfn("} ProjectTreeEnd");
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

    GetRootProj()
    {
        return this.rootProj;
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
            this.m_domain = new ProjDomain("Root", this);
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
            if(config && config.ProjectDir) // _Proj.jsmk specifies a dir
                this.ProjectDir = config.ProjectDir;
            else
                this.ProjectDir = this.Name;
            if(!jsmk.path.isAbsolute(this.ProjectDir))
            {
                this.ProjectDir = jsmk.path.join(this.m_parent.ProjectDir,
                                                 this.ProjectDir);
            }
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
            {
                throw Error(this.Name + " can't find project file:" + 
                            this.ProjectFilePath);
            }
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
            jsmk.TRACE(name + " " + jsmk.path.relative(this.GetRootDir(), this.ProjectDir) + " init (functional)");
            config.init(this);
        }
        else
        {
            jsmk.TRACE("loading: " + this.ProjectFilePath);
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
        if(!jsmk.path.isAbsolute(this.ProjectDir))
            throw Error("project directories must be absolute paths");
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
       return this.m_domain.GetRootProj().ProjectDir; 
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

    EstablishDomain(name, toolsetConstraints, config)
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
        if(config)
        {
            if(config.Package)
                this.SetBuildVar("Package", config.Package);
        }
        // Here's where template flattening (for BuiltDir, etc occurs).
        // ${Module} isn't defined until Module creation so one more pass
        // of flattening occurs.
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
                throw proj; // communicate proj to TraverseBelow
            }
        });
    }

    // convenience method for _Proj file authors
    Glob(pat)
    {
        return jsmk.path.glob(pat);
    }

    NewModule(name, config)
    {
        let mm = this.findSiblingModule(name);
        if(mm)
            jsmk.WARNING(`Module name reused ${this.Name}/${name}`);

        let m = new Module(name, this, config);
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

    // BuildInlineCppProjects:
    //   Constructs a 2-level inline project tree useful for typical open-source 
    //   projects where we don't wish to drop _Proj.jsmk files directly into a
    //   potentially foreign/read-only git repo.
    //   Input is a list of javascript objects, each triggering the creation
    //   of a project. The entire collection of projects resides below the
    //   basename project (usually "apps" or "libs") the input barrier
    //   can be set to "after" to signal that following sibling projects 
    //   should only be built after the completion of the previous.  Common
    //   usage is to have a libs project follwed by an apps project.
    //   Each entry of projlist will create a second-level project and is
    //   usually associated with a directory within the directory structure.  
    //   It's okay to have multiple subproject associated with a single dir,
    //   (at least until proven otherwise).
    //
    //   NB: our canonical form for a single entry in projlist:
    //      project name
    //          module name (same as proj)
    //              #lib creation (optional)
    //                  cpp->o task 
    //                  c->o task 
    //                  o->a task 
    //              #exe creation (optional)
    //                  cpp->o task (app link inputs)
    //                  c->o task (app link inputs)
    //                  cpp.o->exe task
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
                for(let i in projlist)
                {
                    let projdir = projlist[i].dir;
                    let projnm;
                    if(projlist[i].name)
                        projnm = projlist[i].name;
                    else
                        projnm = jsmk.path.tail(projdir);
                    if(projlist[i].skip === true)
                        continue;
                    let src = projlist[i].src;
                    let inc = projlist[i].inc;
                    let defs = projlist[i].defs;
                    let cflags = projlist[i].flags;
                    let ldflags = projlist[i].ldflags;
                    let modules = projlist[i].modules;
                    let triggers = projlist[i].triggers;
                    let deplibs = projlist[i].deps;
                    if(!deplibs)
                    {
                        // libs is deprecated (use deps or modules)
                        deplibs = projlist[i].libs; 
                    }
                    let syslibs = projlist[i].syslibs;
                    let clientcfg = projlist[i].clientconfig;
                    let isApp = (deplibs || syslibs);

                    subProj.NewProject(projnm, {
                        ProjectDir: projdir,
                        init: function(subProj) {
                            let modConfig = clientcfg ? 
                                   {clientconfig: clientcfg} : {};
                            let m = subProj.NewModule(projnm, modConfig);
                            let libInputs = [], appInputs = [];
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
                                        triggers: triggers,
                                    });
                                    libInputs = libInputs.concat(tcpp.GetOutputs());
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
                                        triggers: triggers,
                                    });
                                    libInputs = libInputs.concat(tc.GetOutputs());
                                }
                            }
                            if(libInputs.length > 0)
                            {
                                let libnm;
                                if(isApp) 
                                    libnm = "lib" + projnm;
                                else
                                    libnm = projnm;
                                let tlib = m.NewTask(libnm, "o->a", {
                                    inputs: libInputs,
                                });
                                if(isApp)
                                    appInputs = tlib.GetOutputs();
                            }
                            else
                            if( !src.appcpp && !src.appc && 
                                !src.dllcpp && !src.dllc && 
                                !src.cpp && !src.c 
                                )
                            {
                                // nb: there may be header-only modules used
                                // to configure clients
                                jsmk.WARNING(`${projnm} has no archiveable objects`);
                            }

                            if(src.appcpp || src.dllcpp)
                            {
                                let srcfiles = [];
                                if(typeof src.appcpp == "string")
                                    src.appcpp = [src.appcpp];
                                if(typeof src.dllcpp == "string")
                                    src.dllcpp = [src.dllcpp];
                                for(let i in src.appcpp)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.appcpp[i]));
                                for(let i in src.dllcpp)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.dllcpp[i]));
                                excludeFiles(srcfiles, src.exclude);
                                if(srcfiles.length)
                                {
                                    let tcpp = m.NewTask("compile_appcpp", "cpp->o", {
                                        inputs: srcfiles,
                                        flags: cflags,
                                        searchpaths: inc,
                                        define: defs,
                                        triggers: triggers,
                                    });
                                    appInputs = appInputs.concat(tcpp.GetOutputs());
                                }
                            }
                            if(src.appc || src.dllc)
                            {
                                let srcfiles = [];
                                if(typeof src.appc == "string")
                                    src.appc = [src.appc];
                                if(typeof src.dllc == "string")
                                    src.dllc = [src.dllc];
                                for(let i in src.appc)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.appc[i]));
                                for(let i in src.dllc)
                                    srcfiles = srcfiles.concat(subProj.Glob(src.dllc[i]));
                                excludeFiles(srcfiles, src.exclude);
                                if(srcfiles.length)
                                {
                                    let tc = m.NewTask("compile_appc", "c->o", {
                                        inputs: srcfiles,
                                        flags: cflags,
                                        searchpaths: inc,
                                        define: defs,
                                        triggers: triggers,
                                    });
                                    appInputs = appInputs.concat(tc.GetOutputs());
                                }
                            }
                            if(appInputs.length > 0)
                            {
                                let inputs = appInputs;
                                let deps = [];
                                for(let i in deplibs)
                                    deps = deps.concat(rootproj.FindModuleOutputs(deplibs[i]));
                                let rule = (src.dllcpp || src.dllc) ? 
                                            "cpp.o->so" : "cpp.o->exe";
                                let tapp = m.NewTask(projnm, rule, {
                                    inputs: inputs,
                                    deps: deps,
                                    libs: syslibs,
                                    flags: ldflags,
                                    // apps don't configclients, right?
                                });
                                if(src.installdir)
                                {
                                    let irule = "install";
                                    let iname = projnm+"Install";
                                    let inputs = tapp.GetOutputs();
                                    m.NewTask(iname, irule, {
                                        inputs: inputs,
                                        installdir: src.installdir, 
                                        installext: src.installext, // undef ok
                                    });
                                }
                            }
                            // we add modules last to this module
                            // so it doesn't get burned into tasks...
                            // rather modules are applied late...
                            if(modules)
                            {
                                m.AddModules(modules);
                            }
                        }
                    });
                }
            }
        });
        return newProj;
    }
}

