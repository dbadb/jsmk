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

class Project extends SettingsContainer
{
    // name is project name and default subdir (config.ProjectDir overrides)
    // parent is parent project, unless root where it's the policy.
    // config:
    //      ProjectDir
    constructor(name, parent, policy, config)
    {
        super();
        this.Name = name;
        this.m_policy = policy;
        this.m_parent = parent;
        this.m_children = [];
        this.m_modules = [];
        this.m_config = config;
        this.m_domain = null;
        if(!parent)
        {
            this.m_domainName = "Root";
            this.m_domain = this;  // we're the root project
        }
        else
        {
            this.m_domainName = parent.m_domainName;
            this.m_domain = parent.m_domain;
        }

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

        if(!jsmk.path.exists(this.ProjectFilePath))
            throw this.Name + " can't find project file:" + this.ProjectFilePath;

        // create settings, for project-file-load to populate
        this.m_settings = new SettingsContainer(parent ? parent.m_settings: null);

        // now load the user-space file....
        let lastProj = global.Project;
        global.Project = this;
        try
        {
            jsmk.DEBUG("loading: " + this.ProjectFilePath);
            process.chdir(this.ProjectDir);
            require(this.ProjectFilePath);
        }
        catch (e)
        {
            jsmk.ERROR(e);
        }
        global.Project = lastProj;
    }

    EstablishDomain(name)
    {
        jsmk.DEBUG(`Project domain ${name} established`);
        this.m_domainName = name;
        this.m_domain = this;
    }

    // following methods are avaiable to Project files.
    NewProject(name, config)
    {
        let newproj = new Project(name, this, this.m_policy, config);
        this.m_children.push(newproj);
    }

    FindProjectNamed(name)
    {
        return this.TraverseBelow(function(proj) {
            if(name === proj.Name)
            {
                throw proj;
            }
        });
    }

    Glob(pat)
    {
        return jsmk.path.glob(pat);
    }

    NewModule(name, config)
    {
        let mm = this.FindModule(name);
        if(mm)
            jsmk.WARNING(`Module name reused $[this.Name}/${name}`);

        let m = new Module(name, this, config);
        this.m_modules.push(m);
        return m;
    }

    FindModule(name)
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

    *IterateWork(stage) // returns a promise on each iteration
    {
        for(m of this.m_modules)
            yield *m.IterateWork(stage);
        return null;
    }

    *IterateProjects(style)
    {
        if(style === "breadthfirst") yield this;
        for(let p of this.m_children)
        {
            yield *p.IterateProjects(style);
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
    let projTree = new Project("Root", null, policy,
                        {
                            ProjectDir: policy.RootDir
                        });
    jsmk.DEBUG("ProjectTreeBegin {");
    let visitor = function(proj, level) {
                jsmk.DEBUG(" ".repeat(level+1) + proj.Name);
            };
    projTree.TraverseBelow(visitor, 0);
    jsmk.DEBUG("} ProjectTreeEnd");

    return projTree;
}
