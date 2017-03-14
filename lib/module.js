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

    *GenerateWork(stage)
    {
        for(let task of this.m_tasks)
            yield *task.GenerateWork(stage);
        return null;
    }
};


exports.Module = Module;
