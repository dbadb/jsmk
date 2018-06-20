/* global jsmk */
let SettingsContainer = require("./settingscontainer").SettingsContainer;
let Task = require("./task").Task;
let Tool = require("./tool").Tool;

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

    GetName()
    {
        return this.m_name;
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

    GetOutputDir()
    {
        return this.m_builtDir;
    }

    // a module's outputs is defined as the outputs of its last task.
    GetOutputs()
    {
        let ntasks = this.m_tasks.length;
        if(ntasks > 0)
            return this.m_tasks[ntasks - 1].GetOutputs();
        else
            return null;
    }

    ConfigureTask(t)
    {
        let role = t.GetTool().GetRole();
        jsmk.DEBUG(`${t.GetModName()} configured by ${this.GetName()} + ${role}`);

        let sp = this.GetSearchPaths(role);
        let taskdir = t.GetWorkingDir();
        let mydir = this.GetWorkingDir();
        if(sp && sp.length)
        {
            // searchpaths are often proj-relative pathnames.
            // we can either re-normalize to tasks' working dir or
            // make them absolute.
            let nsp = [];
            for(let i in sp)
            {
                let pp = sp[i];
                if(jsmk.path.isAbsolute(pp))
                    nsp.push(pp);
                else
                {
                    let ppa = jsmk.path.join(mydir, pp);
                    nsp.push(jsmk.path.relative(taskdir, ppa));
                }
            }
            sp = nsp;
        }

        switch(role)
        {
        case Tool.Role.Compile:
            // add searchpaths, defines(?), flags(?)
            jsmk.DEBUG(`searchpaths: ${sp}`);
            t.AddSearchPaths(role, sp);
            t.Define(this.GetDefineMap());
            break;
        case Tool.Role.Link:
            sp = this.GetSearchPaths(role);
            jsmk.DEBUG(`searchpaths: ${sp}`);
            t.AddSearchPaths(role, sp);
            break;
        default:
            jsmk.DEBUG(`${t.GetModName()} not configured`);
            break;
        }
    }

    *GenerateWork(stage)
    {
        if(stage === "clean")
        {
            let self = this;
            let w = new Promise((resolve, reject) => {
                    jsmk.NOTICE("cleaning " + self.m_builtDir);
                    jsmk.path.rmtree(self.m_builtDir);
                    resolve(self.m_builtDir);
                });
            w._name = this.m_name  + " clean";
            yield w;
        }
        else
        {
            // jsmk.NOTICE(`mod: ${this.m_name} genwork for ${this.m_tasks.length} tasks`);
            for(let i=0;i<this.m_tasks.length;i++)
            {
                let task =  this.m_tasks[i];
                // jsmk.NOTICE(`${task.GetName()}`);
                yield *task.GenerateWork(stage);

                // Tasks are defined as processing serially.
                // Tasks can generate multiple, parallel work units.
                // Rather than require _Proj file authors to explicitly
                // decorate workers with  _blocking, we introduce a
                // no-op blocker to ensure synchronization.
                if(i <= this.m_tasks.length-1)
                {
                    let blocker = new Promise((resolve, reject) => {
                        resolve();
                    });
                    blocker._name = this.m_name + "_taskblock";
                    blocker._blocking = "before";
                    yield blocker;
                }
            }
        }
        return null;
    }
}

exports.Module = Module;
