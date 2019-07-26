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
        this.m_name = name;
        this.m_tool = jsmk.GetTool(rule);
        this.m_inputs = [];
        this.m_outputs = [];
        this.m_outputDir = null;
        this.m_module = module;
        this.m_toolconfig = null;

        // before task is configured explicitly, init via module and tool
        this.MergeSettings(module);
        if(config.outputDir) // populated automatically by m.NewTask
        {
            this.m_outputDir = config.outputDir;
            delete config.outputDir;
        }
        this.m_tool.ConfigureTaskSettings(this, config); // calls this.MergeSettings(tool)
        if(config.inputs)
        {
            this.AddInputs(config.inputs, config.outputs/*may be undefined*/);
            delete config.inputs;
            delete config.outputs;
        }
        this.Configure(this.GetModName(), this.m_tool.GetRole(), config);
    }

    GetTool()
    {
        return this.m_tool;
    }

    GetToolConfig()
    {
        return this.m_toolconfig;
    }

    GetProject()
    {
        return this.m_module.GetProject();
    }

    GetModule()
    {
        return this.m_module;
    }

    AddSrc(filelist) // legacy
    {
        jsmk.WARNING("task.AddSrc is deprecated");
        this.AddInputs(filelist);
    }

    AddInputs(filelist, outputs/*usually undefined*/)
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
            if(outputs)
                this.m_outputs = outputs;
            else
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
        let ret = this.m_module.GetWorkingDir();
        if(!jsmk.path.isAbsolute(ret))
            throw(Error("bad working dir"));
        return ret;
    }

    GetOutputDir()
    {
        return this.m_module.GetOutputDir();
    }

    GetRootDir()
    {
        return this.m_module.GetRootDir();
    }

    GetDomainDir()
    {
        return this.m_module.GetDomainDir();
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
            // task modules applied by module.js
            let inputs = this.m_inputs;
            let depFiles = this.GetDependencies();
            if(depFiles && depFiles.length)
            {
                // jsmk.NOTICE("task dependencies: " + depFiles);
                inputs = inputs.concat(depFiles);
            }
            let triggers = this.GetTriggers();
            w = this.m_tool.GenerateWork(stage, this, inputs, triggers, 
                                            this.m_outputs);
        }
        catch(err)
        {
            jsmk.ERROR("Misconfigured task: " + this.GetModName());
            throw(err);
        }
        yield *w;
    }
}

exports.Task = Task;
