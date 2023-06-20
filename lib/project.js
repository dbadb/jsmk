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
let klawSync = require("klaw-sync");
let BuildInlineProjects = require("./projInline").BuildInlineCppProjects;

exports.NewProjectTree = function(toolset, policy)
{
    // NB: instantiating the root, automatically loads subprojects recursively.
    let projTree = new Project("Root", null, policy,
                    {
                        ProjectDir: policy.RootDir
                    });
    return projTree;
};

exports.DumpProjectTree = function(projTree, loglevel="DEBUG", xlevel="DEBUG")
{
    let logfn = jsmk[loglevel];
    let detailsfn = jsmk[xlevel];
    logfn("ProjectTreeBegin {");
    let visitModules = function(proj, depth)
    {
        let nmod = proj.m_modules.length;
        if(nmod == 0) return;

        let indent = "  ".repeat(depth+1);
        detailsfn(indent + `modules ${nmod}`);
        for(let m of proj.m_modules)
        {
            let ntasks = m.GetSummary();
            let str = `${indent} ${m.GetSummary()}`;
            detailsfn(str)
        }
    }
    let visitProj = function(proj, depth, w)
    {
        if(w === "before")
        {
            let str = "  ".repeat(depth+1) + proj.Name;
            let xstr;
            if(proj.IsDomainController())
            {
                str = str + " - Domain " + proj.GetDomainName();
                xstr = "  ".repeat(depth+2) + "modMap: " + 
                    Object.keys(proj.GetDomain().moduleMap);
            }

            if(proj.m_barrier)
                str = str + ` - ${proj.m_barrier} barrier`;
            str += ` ${proj.ProjectDir}`;
            logfn(str);
            if(xstr)
                logfn(xstr);
            visitModules(proj, depth + 1);
        }
    };
    projTree.TraverseBelow(visitProj, 0);
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
        // jsmk.INFO("add module " + mnm);
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
    // name is project name and default subdir, config.ProjectDir overrides
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
            this.ProjectDirRelative = jsmk.path.relative(this.m_policy.RootDir, this.ProjectDir);
            if(config.ProjectFilePath)
            {
                this.ProjectFilePath = config.ProjectFilePath;
                if(!jsmk.path.isAbsolute(this.ProjectFilePath))
                {
                    this.ProjectFilePath = jsmk.path.join(this.m_parent.ProjectDir,
                                                        this.ProjectFilePath);
                }
            }
            else
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
        this.SetBuildVar("ROOTDIR", jsmk.path.relative(this.ProjectDir, this.GetRootDir()));
        this.SetBuildVar("INCDIR", this.ProjectDir); // a default buildvar
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
            jsmk.TRACE(name + " " + jsmk.path.relative(this.GetRootDir(), this.ProjectDir)  +
                        " init (functional)");
            config.init(this);
        }
        else
        {
            if(config.initFile)
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
            for(let key of Object.keys(config))
            {
                this.SetBuildVar(key, config[key]);
            }
            if(config.TimestampFile)
            {
                // name of file to deposit a build timestamp. (NB: currently
                // we don't detect whether we've built anything, just that we
                // been asked to do so.
                let tsfile = jsmk.path.join(this.ProjectDir, config.TimestampFile);
                let t = new Date();
                let ts = {
                    app: config.AppName,
                    deployment: this.GetBuildVar("Deployment"),
                    vers: config.Version,
                    track: config.Track,
                    built: t.toLocaleString("en-us",{timeZoneName:"short"}),
                    iso: t.toISOString(),
                    by: `jsmk ${jsmk.GetPolicy().GetStages().join(" ")}`,
                };
                jsmk.file.write(tsfile, JSON.stringify(ts, null, 2)+"\n", (err) =>
                {
                    jsmk.INFO(`${name} wrote timestamp to ${config.TimestampFile} (${err})`);
                });
            }
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

    // convenience method for _Proj file authors:
    // search through all subdirectories comparing
    // filename against regex.
    FindFiles(dir, regex)
    {
        let filterFn = (item) =>
        {
            return item.stats.isFile() && 
                    regex.test(item.path);
        };
        return klawSync(dir, {
            traverseAll: true, 
            filter: filterFn
        }).map((item) =>
        {
            return jsmk.path.relative(dir, item.path);
        });
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
        {
            let outputs =  m.GetOutputs();
            if(!outputs || ouputs.length == 0)
            {
                jsmk.WARNING(`Module ${mnm} has no outputs`);
                outputs = [];
            }
            return outputs;
        }
        else
        {
            jsmk.WARNING(`No module named ${mnm} found`);
            return undefined;
        }
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

            jsmk.DEBUG(`Traversal error: ${e}`);
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

    BuildInlineCppProjects(basename, projlist, barrier)
    {
        BuildInlineProjects(this, basename, projlist, barrier);
    }
}


