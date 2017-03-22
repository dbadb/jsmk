let Scheduler = require("./scheduler").Scheduler;
class Engine
{
    constructor(stage, projTree, startdir, threads)
    {
        this.m_stage = stage;
        this.m_projTree = projTree;
        this.m_startDir = startdir;
        this.m_threads = threads;
    }

    // Run: for the current toolset + policy + project tree + stage
    //
    //  Promise.map allows us to run tasks in parallel with a limit
    //      on the number of concurrent tasks.
    //  Promise.each allows us to run taks in serial.
    //
    //  We actually need a combination of both: Module's tasks run serially,
    //  but an individual task might be composed of several parallel
    //  units of work.  Or we might wish to schedule tasks from two
    //  Projects concurrently.
    //
    //  One design: we have N worker threads that "race" to pull
    //  values off the shared work list. Synchronization is an
    //  issue here, since pulling a worker off the worker queue
    //  doesn't convey completion state.
    //
    //  If a unit of work is a Promise of type ma, toolsetp or each
    //  and if we can share the current
    //
    Run(toolset, stage)
    {
        //  console.log("Run " + stage + " for " + toolset.GetName());
        let self = this;
        return new Promise((resolve, reject) => {
            let workgenQ = new Scheduler({
                            maxConcurrency: this.m_threads,
                            onDone: resolve,
                            onError: reject,
                            name: stage + "_scheduler"
                        });
            let pruner = function(proj)
            {
                let prune = !proj.AcceptsToolset(toolset);
                if(prune)
                    jsmk.NOTICE(`${proj.GetName()} skipping toolset ${toolset.GetName()}`);
                else
                {
                    // subtree isn't pruned, but may have a barrier
                    // barrier semantics are breadthfirst", but work-traversal
                    // is depthfirst. So we implement barriers here.
                    let b = proj.GetBarrier();
                    if(b)
                        workgenQ.Append(null, b);
                }
                return prune;
            };

            let projIterator = this.m_projTree.IterateProjects("depthfirst", pruner);
            let hasWork = false;
            while(true)
            {
                let proj = projIterator.next().value;
                if(!proj) break;
                if(jsmk.path.issubdir(proj.ProjectDir, this.m_startDir))
                {
                    let w = proj.GenerateWork(stage);
                    if(w)
                    {
                        hasWork = true;
                        workgenQ.Append(w);
                    }
                }
                else
                {
                    //jsmk.DEBUG(`prune: ${proj.GetName()} ${proj.ProjectDir}, ${this.m_startDir}`);
                }
            }
            if(!hasWork)
                resolve();
        }); // engine's promise monitored by multistage Build
    }
}

exports.Engine = Engine;
