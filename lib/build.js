var Project = require("./project.js");

/*---------------------------------------------------------------------*/
class Build
{
    constructor (policy, toolset)  // ---- constructor -----
    {
        this.m_policy = policy;
        this.m_toolset = toolset;
        this.m_projectTree = undefined;
    }

    BuildIt()
    {
        // Here we loop over toolsets associated with host and user
        // We rebuild the project tree with the toolset since entire
        // subtrees may be toolset-dependent.
        jsmk.NOTICE("Loading project tree for " + this.m_toolset.GetName());
        this.m_projectTree = Project.NewProjectTree(this.m_toolset);
    }
}

exports.Build = Build;
