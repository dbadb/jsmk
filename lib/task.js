//
//
//
let SettingsContainer = require("./settingscontainer").SettingsContainer;

class Task extends SettingsContainer
{
    constructor(name, rule, config)
    {
        super();
        this.m_name = name;
        this.m_rule = rule; // want access to tool here..
        this.m_config = config;
        this.m_inputs = [];
        this.m_outputs = [];
        if(config)
        {
            this.m_inputs = config.inputs;
        }
    }

    GetOutputs()
    {
        return this.m_outputs;
    }
};

exports.Task = Task;
