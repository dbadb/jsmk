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

class ProjDomain
{
    constructor(name, proj, parent, toolsetConstraints)
    {
        this.name = name;
        this.controller = proj;
        this.parent = parent;
        this.toolsetConstraints = toolsetConstraints;
        this.moduleMap = {};
    }

    AddModule(m)
    {
        let mnm = m.GetName();
        if(this.moduleMap[mnm])
            jsmk.WARNING("conflicting module name " + mnm);
        else
            this.moduleMap[mnm] = m;
    }

    FindModuleOutputs(nm)
    {
        let m = this.moduleMap[nm];
        if(m)
            return m.GetOutputs();
        else
            return undefined;
    }

    AcceptsToolset(toolset)
    {
        let result = true;
        if(toolset && this.toolsetConstraints)
        {
            result = this.toolsetConstraints.test(toolset.GetName());
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
        this.m_barrier = config ? config.barrier : null;

        if(this.m_parent)
            this.MergeSettings(this.m_parent);

        if(!jsmk.path.exists(this.ProjectFilePath))
            throw this.Name + " can't find project file:" + this.ProjectFilePath;

        // now load the user-space file to add modules, tasks, subprojects
        // need to have the inheritable settings in place
        this.m_policy.ConfigureProjSettings(this); // template flattening

        config.ProjectDir = this.ProjectDir;
        this.MergeBuildVars(config);

        let lastProj = global.Project;
        global.Project = this;

        //  following may throw
        jsmk.DEBUG("loading: " + this.ProjectFilePath);
        process.chdir(this.ProjectDir);
        delete require.cache[require.resolve(this.ProjectFilePath)];
        require(this.ProjectFilePath);

        global.Project = lastProj;
    }

    GetName()
    {
        return this.Name;
    }

    EstablishDomain(name, toolsetConstraints)
    {
        jsmk.DEBUG(`Project domain ${name} established`);
        this.m_domain = new ProjDomain(name, this, this.m_domain,
                                       toolsetConstraints);
    }

    IsRoot()
    {
        return this.m_parent ?  false : true;
    }

    IsDomainController()
    {
        return this.m_domain.controller === this;
    }

    AcceptsToolset(toolset)
    {
        return this.m_domain.AcceptsToolset(toolset);
    }

    // following methods are avaiable to Project files.
    NewProject(name, config)
    {
        if(this.AcceptsToolset(jsmk.GetActiveToolset()))
        {
            let newproj = new Project(name, this, this.m_policy, config);
            this.m_children.push(newproj);
        }
        else
        {
            jsmk.DEBUG(this.GetName() + " not loading subproject: " + name +
                        " (toolset rejected)");
        }
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

    NewModule(name, config)
    {
        let mm = this.findModule(name);
        if(mm)
            jsmk.WARNING(`Module name reused $[this.Name}/${name}`);

        let m = new Module(name, this, config);
        this.m_domain.AddModule(m);
        this.m_modules.push(m);
        return m;
    }

    // findModule, only consults this project
    findModule(name)
    {
        for(m of this.m_modules)
        {
            if(m.GetName() === name)
            {
                return m;
            }
        }
        return null;
    }

    FindModuleOutputs(mnm)
    {
        return this.m_domain.FindModuleOutputs(mnm);
    }

    GetBarrier()
    {
        return this.m_barrier;
    }

    *GenerateWork(stage) // returns a promise on each iteration
    {
        for(let m of this.m_modules)
            yield *m.GenerateWork(stage);
        return null;
    }

    *IterateProjects(style, pruneCallback)
    {
        if(pruneCallback && pruneCallback(this))
            return;

        if(style === "breadthfirst") yield this;
        for(let p of this.m_children)
        {
            yield *p.IterateProjects(style, pruneCallback);
        }
        if(style === "depthfirst") yield this;
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

};

exports.NewProjectTree = function(toolset, policy)
{
    // nb: instantiating the root, automatically loads subprojects
    //     recursively.
    let projTree = new Project("Root", null, policy,
                        {
                            ProjectDir: policy.RootDir
                        });

    jsmk.DEBUG("ProjectTreeBegin {");
    let visitor = function(proj, level, w) {
                if(w === "before")
                    jsmk.DEBUG(" ".repeat(level+1) + proj.Name);
            };
    projTree.TraverseBelow(visitor, 0);
    jsmk.DEBUG("} ProjectTreeEnd");

    return projTree;
}
