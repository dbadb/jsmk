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

    GetProjTree()
    {
        return this.m_projectTree;
    }
    BuildIt()
    {
        // Here we loop over toolsets associated with host and user
        // We rebuild the project tree with the toolset since entire
        // subtrees may be toolset-dependent.
        this.m_projectTree = Project.NewProjectTree(this.m_toolset,
                                                    this.m_policy);
    }
}

exports.Build = Build;
