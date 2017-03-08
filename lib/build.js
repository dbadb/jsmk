//
//
//
let Engine = require("./engine.js").Engine;
let NewProjectTree = require("./project.js").NewProjectTree;

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
        jsmk.TIMESTAMP(`-- Loading project tree for ${this.m_toolset.GetName()} `
                     + "-".repeat(10));
        this.m_projectTree = NewProjectTree(this.m_toolset, this.m_policy);
        Promise.each(this.m_policy.BuildStages, function(stage) {
            jsmk.NOTICE(`-- ${stage} ----`);
            let engine = new Engine(stage, this.m_projectTree,
                                     this.m_policy.StartDir);
            engine.Run(stage); // blocks!
        });
    }
}

exports.Build = Build;
