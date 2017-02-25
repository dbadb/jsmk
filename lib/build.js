var proj = require("./project.js");
exports.NewBuild = function(jsmk, policy) // ---- factory ---------------------------
{
    return new Build(jsmk, policy);
}

/*---------------------------------------------------------------------*/
class Build
{
    constructor (jsmk, policy, toolset)  // ---- constructor -----
    {
        this.m_jsmk = jsmk;
        this.m_policy = policy;
        this.m_toolset = toolset;
        this.m_projectTree = undefined;
    }

    BuildIt()
    {
        // Here we loop over toolsets associated with host and user
        // We rebuild the project tree with the toolset since entire
        // subtrees may be toolset-dependent.
        this.m_jsmk.NOTICE("Loading project tree for " + ts.GetName());
        this.m_projectTree = proj.NewProjectTree(this.m_jsmk, ts);
    }
}
