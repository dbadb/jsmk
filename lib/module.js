let SettingsContainer = require("./settingscontainer").SettingsContainer;
let Task = require("./task").Task;

class Module extends SettingsContainer
{
    constructor(name, proj, config)
    {
        super();
        if(!config) config = {};
        config.Module = name;
        this.m_name = name;
        this.m_proj = proj;
        this.m_config = config;
        this.m_tasks = [];
        this.MergeSettings(proj);
        this.MergeBuildVars(config);
        this.m_builtDir = this.EvaluateBuildVar("BuiltDir");
    }

    GetName()
    {
        return this.m_name;
    }

    NewTask(name, rule, config)
    {
        let t;
        if(!config)
            config = {};
        if(!config.outputDir)
            config.outputDir = this.m_builtDir;
        t = new Task(name, rule, this, config);
        this.m_tasks.push(t);
        return t;
    }

    GetWorkingDir()
    {
        return this.m_proj.ProjectDir;
    }

    GetOutputDir()
    {
        return this.m_builtDir;
    }

    // a module's outputs is defined as the outputs of its last task.
    GetOutputs()
    {
        let ntasks = this.m_tasks.length;
        if(ntasks > 0)
            return this.m_tasks[ntasks - 1].GetOutputs();
        else
            return null;
    }

    *GenerateWork(stage)
    {
        if(stage === "clean")
        {
            let self = this;
            let w = new Promise((resolve, reject) => {
                    jsmk.NOTICE("cleaning " + self.m_builtDir);
                    jsmk.path.rmtree(self.m_builtDir);
                    resolve(self.m_builtDir);
                });
            w._name = this.m_name  + " clean";
            yield w;
        }
        else
        {
            for(let i=0;i<this.m_tasks.length;i++)
            {
                let task =  this.m_tasks[i];
                yield *task.GenerateWork(stage);

                // Tasks are defined as processing serially.
                // Tasks can generate multiple, parallel work units.
                // Rather than require _Proj file authors to explicitly
                // decorate workers with  _blocking, we introduce a
                // no-op blocker to ensure synchronization.
                if(i < this.m_tasks.length)
                {
                    let blocker = new Promise((resolve, reject) => {
                        resolve();
                    });
                    blocker._blocking = "before";
                    yield blocker;
                }
            }
        }
        return null;
    }
};


exports.Module = Module;
