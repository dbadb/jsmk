//
//
//
let Engine = require("./engine.js").Engine;
let NewProjectTree = require("./project.js").NewProjectTree;
let Promise = require("bluebird").Promise;

/*---------------------------------------------------------------------*/
class Build
{
    constructor (policy, toolset)  // ---- constructor -----
    {
        this.m_policy = policy;
        this.m_toolset = toolset;
        this.m_projectTree = undefined;
    }

    GetTool(rule)
    {
        if(this.m_toolset)
            return this.m_toolset.GetTool(rule);
        else
            return null;
    }

    GetToolset()
    {
        return this.m_toolset;
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
        let self = this;

        jsmk.NOTICE(`-- Loading project tree for ${this.m_toolset.GetName()} `
                         + "-".repeat(10));
        self.m_projectTree = NewProjectTree(self.m_toolset, self.m_policy);
        return Promise.each(this.m_policy.GetStages(), (stage) => {
            self.buildStage(stage);
        });
    }

    buildStage(stage)
    {
        let self = this;
        return new Promise( (resolve) => {
            jsmk.NOTICE(`-- Perform ${stage} ----`);
            let engine = new Engine(stage, self.m_projectTree,
                                 self.m_policy.StartDir,
                                 self.m_policy.GetThreads());
            engine.Run(this.m_toolset, stage)
                .then( () => {
                    resolve();
                });
        });
    }
}

exports.Build = Build;
