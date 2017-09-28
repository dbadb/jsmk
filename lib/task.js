/* global jsmk */
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
        this.m_toolconfig = null;
        this.MergeSettings(this.m_tool);

        // we allow additional custom vals to be configured via _Proj
        // so we first delete non-custom configs
        // outputDir either comes from optional _Proj or module
        if(config.inputs)
        {
            if(Array.isArray(config.inputs))
                this.m_inputs = config.inputs;
            else
                this.m_inputs = [config.inputs];
            delete config.inputs;
        }
        if(config.outputs)
        {
            if(Array.isArray(config.outputs))
                this.m_outputs = config.outputs;
            else
                this.m_outputs = [config.outputs];
            delete config.outputs;
        }
        if(config.outputDir)
        {
            this.m_outputDir = config.outputDir;
            delete config.outputDir;
        }
        if(config.define)
        {
            this.Define(config.define);
            delete config.define;
        }
        if(config.searchpaths)
        {
            this.AddSearchpaths(this.m_tool.GetRole(), config.searchpaths);
            delete config.searchpaths;
        }
        if(config.flag)
        {
            this.Flag(config.flag);
            delete config.flag;
        }
        if(config.frameworks)
        {
            this.AddFrameworks(config.frameworks);
            delete config.frameworks;
        }
        if(config.toolconfig)
        {
            this.m_toolconfig = config.toolconfig;
            delete config.toolconfig;
        }
        this.MergeBuildVars(config);
        this.m_tool.ConfigureTaskSettings(this);
        this.AddInputs();  // to trigger creation of outputs
    }

    GetTool()
    {
        return this.m_tool;
    }

    GetToolConfig()
    {
        return this.m_toolconfig;
    }

    AddSrc(filelist) // legacy
    {
        jsmk.WARNING("task.AddSrc is deprecated");
        this.AddInputs(filelist);
    }

    AddInputs(filelist)
    {
        if(filelist || this.m_outputs.length === 0)
        {
            if(filelist)
                this.m_inputs = this.m_inputs.concat(filelist);
            this.m_outputs = this.m_tool.DstFilesFromSrc(this.m_name,
                                                    this.m_inputs,
                                                    this.m_outputDir);
        }
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
        if(this.m_outputs.length === 0)
        {
            jsmk.WARNING(`${this.m_module.GetName()}/${this.GetName()}` +
                            " has no outputs");
        }
        return this.m_outputs;
    }

    *GenerateWork(stage)
    {
        // jsmk.NOTICE(this.m_name + " generateWork: " + this.m_inputs.join(","));
        // nb: tools can operate during multiple stages so we leave it to
        //     them. Consider clean & build...
        this.applyFrameworks(stage);
        let w = this.m_tool.GenerateWork(stage, this,
                                        this.m_inputs, this.m_outputs);
        yield *w;
    }

    applyFrameworks(stage)
    {
        let fwlist = this.GetFrameworks();
        if(!fwlist) return;
        for(let fw of fwlist)
            fw.ConfigureTaskSettings(this, stage);
    }

};

exports.Task = Task;
