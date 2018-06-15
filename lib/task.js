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
        if(config.flags)
        {
            this.AddFlags(config.flags);
            delete config.flags;
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
            for(let i in this.m_inputs)
            {
                let infile = this.m_inputs[i];
                let t = typeof(infile);
                if(t != "string")
                {
                    jsmk.ERROR(`task ${this.GetModName()} has invalid input: ${infile} (${t})`);
                }
            }
            this.m_outputs = this.m_tool.DstFilesFromSrc(this.m_name,
                                                    this.m_inputs,
                                                    this.m_outputDir);
            // jsmk.WARNING(this.GetModName() + " inputs:\n  " + JSON.stringify(this.m_inputs));
            // jsmk.WARNING(this.GetModName() + " outputs:\n  " + JSON.stringify(this.m_outputs));
        }
    }

    GetName()
    {
        return this.m_name;
    }

    GetModName()
    {
        return this.m_module.GetName() + "/" + this.m_name;
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
        if(this.m_inputs.length === 0)
        {
            jsmk.WARNING(`${this.GetModName()} has no inputs`);
        }
        if(this.m_outputs.length === 0)
        {
            jsmk.WARNING(`${this.GetModName()} has no outputs`);
        }
        return this.m_outputs;
    }

    *GenerateWork(stage)
    {
        // jsmk.NOTICE(this.m_name + " generateWork: " + this.m_inputs.join(","));
        // nb: tools can operate during multiple stages so we leave it to
        //     them. Consider clean & build...
        var w;
        try
        {
            this.applyFrameworks(stage);
            w = this.m_tool.GenerateWork(stage, this,
                                        this.m_inputs, this.m_outputs);
        }
        catch(err)
        {
            jsmk.ERROR("Misconfigured task: " + this.GetModName());
            throw(err);
        }
        yield *w;
    }

    applyFrameworks(stage)
    {
        let fwlist = this.GetFrameworks();
        if(!fwlist) return;
        for(let fw of fwlist)
            fw.ConfigureTaskSettings(this, stage);
    }
}

exports.Task = Task;
