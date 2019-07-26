/* global jsmk */
let Engine = require("./engine.js").Engine;
let NewProjectTree = require("./project.js").NewProjectTree;
let DumpProjectTree = require("./project.js").DumpProjectTree;
let Promise = require("bluebird").Promise;

/*---------------------------------------------------------------------*/
class Build
{
    constructor (policy, toolset, perform)  // ---- constructor -----
    {
        this.m_policy = policy;
        this.m_toolset = toolset;
        this.m_projectTree = undefined;
        this.m_perform = perform;
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

        jsmk.NOTICE(`-- Loading project tree for ${this.m_toolset.GetHandle()} `
                         + "-".repeat(10));
        self.m_projectTree = NewProjectTree(self.m_toolset, self.m_policy);
        DumpProjectTree(self.m_projectTree, "DEBUG");
        return Promise.each(this.m_policy.GetStages(), (stage) => {
            return self.buildStage(stage);
        }).then(function() {
            // DumpProjectTree(self.m_projectTree, "INFO");
        }); // this promise is monitored by jsmk.doBuild
    }

    buildStage(stage)
    {
        let self = this;
        return new Promise( (resolve, reject) => {
            jsmk.NOTICE(`-- Perform ${stage} ----`);
            if(!this.m_perform)
            {
                resolve();
            }
            else
            {
                let engine = new Engine(stage, self.m_projectTree,
                                 self.m_policy.StartDir,
                                 self.m_policy.GetThreads());
                let promise = engine.Run(this.m_toolset, stage);
                promise.then(() => {
                    // jsmk.INFO(`${stage} resolved`);
                    resolve();
                }, () => {
                    jsmk.WARNING(`${stage} stage failed`);
                    reject();
                })
                .catch( (err)=>{
                    jsmk.WARNING(`${stage} stage errored`);
                    reject(err);
                });
            }
        });
    }
}

exports.Build = Build;
