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

    BuildIt(onDone)
    {
        // Here we loop over toolsets associated with host and user
        // We rebuild the project tree with the toolset since entire
        // subtrees may be toolset-dependent.
        jsmk.TIMESTAMP(`-- Loading project tree for ${this.m_toolset.GetName()} `
                     + "-".repeat(10));
        this.m_projectTree = NewProjectTree(this.m_toolset, this.m_policy);

        let stagesToDo = this.m_policy.GetStages().slice(0); // make a copy
        this.buildStage(stagesToDo, onDone);
    }

    buildStage(stagesToDo, onDone, lastStage)
    {
        let stage = stagesToDo.shift();
        if(lastStage)
            jsmk.NOTICE(`-- Completed ${lastStage} ----`);
        if(stage)
        {
            jsmk.NOTICE(`-- Perform ${stage} ----`);
            let engine = new Engine(stage, this.m_projectTree,
                                 this.m_policy.StartDir);
            engine.Run(stage, this.m_policy.GetThreads(),
                        this.buildStage.bind(this, stagesToDo, onDone, stage));
        }
        else
        {
            if(onDone)
                onDone();
        }
    }
}

exports.Build = Build;
