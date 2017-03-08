let SettingsContainer = require("./settingscontainer").SettingsContainer;
let Task = require("./task").Task;

class Module extends SettingsContainer
{
    constructor(config)
    {
        super();
        this.m_config = config;
        this.m_tasks = [];
    }

    NewTask(name, rule, config)
    {
        let t = new Task(name, rule, config);
        this.m_tasks.push(t);
        return t;
    }

    *GenerateWork(stage)
    {
        for(let task of this.m_tasks)
            yield *task.GenerateWork(stage);
        return null;
    }
};


exports.Module = Module;
