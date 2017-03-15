//
//
//
let SettingsContainer = require("./settingscontainer").SettingsContainer;

class Task extends SettingsContainer
{
    constructor(name, rule, module, config)
    {
        super();
        this.MergeSettings(module);
        this.m_name = name;
        this.m_tool = jsmk.GetTool(rule);
        this.m_inputs = [];
        this.m_outputs = [];
        this.m_outputDir = null;
        this.m_module = module;
        this.MergeSettings(this.m_tool);

        // we allow additional custom vals to be configured via _Proj
        // so we first delete non-custom configs
        // outputDir either comes from optional _Proj or module
        if(config.inputs)
        {
            this.m_inputs = config.inputs;
            delete config.inputs;
        }
        if(config.outputDir)
        {
            this.m_outputDir = config.outputDir;
            delete config.outputDir;
        }
        if(this.m_inputs.length > 0)
        {
            this.AddSrc(this.m_inputs);
        }
        if(config.define)
        {
            this.Define(config.define);
            delete config.define;
        }
        if(config.include)
        {
            this.Include(config.include);
            delete config.include;
        }
        if(config.flag)
        {
            this.Flag(config.flag);
            delete config.flag;
        }
        this.MergeBuildVars(config);
        this.m_tool.ConfigureTaskSettings(this);
    }

    // source can either be added
    AddSrc(filelist)
    {
        this.m_inputs = this.m_inputs.concat(filelist);
        this.m_outputs = this.m_tool.DstFilesFromSrc(this.m_name,
                                                    this.m_inputs,
                                                    this.m_outputDir);
    }

    GetName()
    {
        return this.m_name;
    }

    GetWorkingDir()
    {
        return this.m_module.GetWorkingDir();
    }

    GetOutputDir()
    {
        return this.m_module.GetOutputDir();
    }

    GetOutputs()
    {
        return this.m_outputs;
    }

    *GenerateWork(stage)
    {
        // jsmk.NOTICE(this.m_name + " generateWork");
        yield *this.m_tool.GenerateWork(stage, this,
                                       this.m_inputs, this.m_outputs);
    }
};

exports.Task = Task;
