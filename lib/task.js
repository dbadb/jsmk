//
//
//
let SettingsContainer = require("./settingscontainer").SettingsContainer;

class Task extends SettingsContainer
{
    constructor(name, rule, module, config)
    {
        super();
        this.m_name = name;
        this.m_tool = jsmk.GetTool(rule);
        this.m_config = config;
        this.m_inputs = [];
        this.m_outputs = [];
        this.MergeSettings(module);
        if(config)
        {
            this.m_inputs = config.inputs;
            this.m_outputs = this.m_tool.DstFilesFromSrc(this.m_name,
                                                        this.m_inputs,
                                                        config.outputDir);
        }
    }

    GetOutputs()
    {
        return this.m_outputs;
    }

    *GenerateWork()
    {
        if(this.m_tool)
        {
            yield *this.m_tool.GenerateWork(this, this.m_inputs, this.m_outputs);
        }
    }
};

exports.Task = Task;
