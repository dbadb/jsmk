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
        this.m_actionStage = null; // null means follow the tool's 
        this.m_modifyInvoc = config.modifyInvoc; // usually undefined

        // before task is configured explicitly, init via module and tool
        this.MergeSettings(module);

        // we need to merge our config settings prior to tool overrides, 
        // since it may inspect, then override them.
        if(config.outputDir) // populated automatically by m.NewTask
        {
            this.m_outputDir = config.outputDir;
            delete config.outputDir;
        }
        if(config.actionstage)
        {
            jsmk.DEBUG(this.GetModName() + ` has custom action stage ${config.actionstage}`);
            this.m_actionStage = config.actionstage;
            delete config.actionstage;
        }
        let stashBuildVars = Object.assign({}, config.buildvars);
        /* (this disallowed requesting special behavior from the tool)
        if(stashBuildVars)
        {
            delete config.buildvars;
        }
        */
        this.Configure(this.GetModName(), this.m_tool.GetRole(), config);

        // frameworks often call eg AddLibs which should usually precede
        // the tool's calls to AddLibs.
        for(let fwnm of this.GetFrameworks())
        {
            let fw = jsmk.GetFramework(fwnm, this.BuildVars);
            if(fw)
                fw.ConfigureTaskSettings(this);
        }
        // should frameworks depend upon results of m_tool.ConfigureTaskSettings?
        // Perhaps: optimization settings may trigger different framework configs.
        this.m_tool.ConfigureTaskSettings(this, config);

        // calls this.MergeSettings(tool) which populates with tools 
        // values BuildVars
        if(stashBuildVars)
        {
            this.MergeBuildVars(stashBuildVars);
            // console.log(`${this.GetModName()} buildvars ${Object.keys(this.BuildVars)}`);
            // console.log("InstallDir: " + this.BuildVars.InstallDir);
        }
        if(config.inputs)
        {
            this.AddInputs(config.inputs, config.outputs /*may be undefined*/ );
            delete config.inputs;
            delete config.outputs;
        }
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

    AddSearchPaths(role, dirs)
    {
        if(dirs === undefined)
        {
            dirs = role;
            role = this.m_tool.GetRole();
        }
        super.AddSearchPaths(role, dirs);
    }

    AddFlags(role, flags) /* role may be missing */
    {
        if(flags === undefined)
        {
            flags = role;
            role = this.m_tool.GetRole();
        }
        super.AddFlags(role, flags);
    }

    AddInputs(filelist, outputs /*usually undefined*/ )
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
            {
                this.m_outputs = this.m_tool.DstFilesFromSrc(this.m_name,
                    this.m_inputs,
                    this.m_outputDir,
                    this.BuildVars.Semantics/*usually undefined*/,
                    this.BuildVars.DstExt);
                /*
                if(this.BuildVars.Semantics)
                {
                    jsmk.NOTICE("overridden semantics:" + this.BuildVars.Semantics);
                    if(this.BuildVars.Semantics == "ManyToOne")
                    {
                        jsmk.NOTICE(`inputs: ${this.m_inputs.length}, outputs: ${this.m_outputs.length}`);
                    }
                }
                */
            }
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
            throw (Error("bad working dir"));
        return ret;
    }

    GetOutputDir()
    {
        return this.m_outputDir || this.m_module.GetOutputDir();
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

    GetActionStage()
    {
        return this.m_actionStage || this.m_tool.GetActionStage();
    }

    // optional just-in-time override invoc for each task
    // invoked by eg tool_cli.
    ModifyInvoc(invoc, newinvoc) 
    {
        if(this.m_modifyInvoc)
            this.m_modifyInvoc(this, invoc, newinvoc);
    }

    * GenerateWork(stage)
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
            let tstage = this.GetActionStage(); 
            if(this.m_actionStage == stage)
                jsmk.INFO(`${this.GetModName()} overriding tool stage: ${stage}`);
            let doit = (stage === tstage);
            w = this.m_tool.GenerateWork(doit, this, inputs, triggers,
                this.m_outputs);
        }
        catch (err)
        {
            jsmk.ERROR("Misconfigured task: " + this.GetModName());
            throw (err);
        }
        yield* w;
    }
}

exports.Task = Task;
