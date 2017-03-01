let Settings = require("./settings").Settings;
let Task = require("./task").Task;

class Module
{
    constructor(config)
    {
        this.m_config = config;
        this.m_tasks = [];
    }

    NewTask(name, rule, config)
    {
        let t = new Task(name, rule, config);
        this.m_tasks.push(t);
        return t;
    }

};


exports.Module = Module;
