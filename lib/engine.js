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
    //  If a unit of work is a Promise of type map or each
    //  and if we can share the current
    //
    //
    Run(stage)
    {
        return new Promise( (resolve) => {
            let workgenQ = new Scheduler({
                            maxConcurrency: this.m_threads,
                            onDone: resolve
                        });
            let projIterator = this.m_projTree.IterateProjects("depthfirst");
            while(true)
            {
                let proj = projIterator.next().value;
                if(!proj) break;
                if(jsmk.path.issubdir(proj.ProjectDir, this.m_startDir))
                {
                    workgenQ.Append(proj.GenerateWork(stage));
                }
            }
        });
    }
}

exports.Engine = Engine;
