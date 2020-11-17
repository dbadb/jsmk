/* global jsmk */
let Tool = require("./tool.js").Tool;
let execFile = require("child_process").execFile;
let spawn = require("child_process").spawn;

class Tool_Cli extends Tool
{
    constructor(toolset, name, config)
    {
        super(toolset, name, config);
        if(Array.isArray(config.Invocation))
            this.m_invocation = config.Invocation;
        else
            throw new Error("Tool_cli: Invocation must be an array");
        this.useSpawn = config ? config.LiveOutput : false;
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }

    BeginStage(stage, task)
    {
    }

    *GenerateWork(doit, task, inputs, triggers, outputs)
    {
        if(!doit) return; // handled here since our return of empty work is magically handled
        // jsmk.INFO(this.m_name + " GenerateWork " + stage + " " +
        //          this.m_semantics+" "+inputs.length+"-"+outputs.length);
        let taskDir = task.GetWorkingDir();
        let tnm = task.GetName();
        let outputdir = task.GetOutputDir();
        jsmk.path.makedirs(outputdir);
        let invoc;
        let envmap = {};
        if(triggers == null || triggers == undefined)
            triggers = [];
        Object.assign(envmap, process.env);
        Object.assign(envmap, task.EnvMap);
        switch(this.m_semantics)
        {
        case Tool.Semantics.NoneToNone:
            invoc = this.getInvocation(task, null, null);
            yield this.makeWork(task, invoc, taskDir, null, tnm, envmap);
            break;
        case Tool.Semantics.OneToNone:
            // since we have no outputs, we always run this tool
            invoc = this.getInvocation(task, inputs, []);
            yield this.makeWork(task, invoc, taskDir, null, tnm, envmap);
            break;
        case Tool.Semantics.ManyToOne:
            if(this.outputIsDirty(outputs[0], inputs.concat(triggers), taskDir))
            {
                invoc = this.getInvocation(task, inputs, outputs);
                yield this.makeWork(task, invoc, taskDir, outputs[0], tnm, envmap);
            }
            break;
        case Tool.Semantics.OneToOne:
        case Tool.Semantics.ManyToMany:
            for(let i=0;i<inputs.length;i++)
            {
                let input = inputs[i];
                let output = outputs[i];
                if(this.outputIsDirty(output, input.concat(triggers), taskDir))
                {
                    invoc = this.getInvocation(task, [input], [output]);
                    let tnmt = `${tnm}_${i}/${inputs.length}`;
                    yield this.makeWork(task, invoc, taskDir, output, tnmt,envmap);
                }
            }
            break;
        }
    }

    // getInvocation scans the tool-specific invocation for
    //  special patterns that require substitution.
    //  return value is a list of args.

    getInvocation(task, inputs, outputs)
    {
        let argc0 = this.m_invocation[0], arglist;
        if(this.m_invocation.length == 2)
            arglist = this.m_invocation[1].split(" ");
        else
            arglist = this.m_invocation.slice(1);
        let result = [argc0];
        let subst;
        let fallbackMap =
        {
            SRCFILE: inputs ? inputs[0] : "",
            SRCFILEBASENOEXT: inputs? jsmk.path.basenameNoExt(inputs[0]) : "",
            DSTFILE: outputs ? outputs[0] : "",
            BUILTDIR: task.GetOutputDir(),
        };
        task.MergeBuildVars(fallbackMap); // lays fallbackMap atop task (XXX: revisit)
        for(let i=0; i < arglist.length; i++)
        {
            let w = arglist[i];
            if(!w) continue;
            switch(w)
            {
            case "${SRCFILE}":
            case "${SRCFILES}":
                result = result.concat(inputs);
                break;
            case "${DSTFILE}":
            case "${DSTFILES}":
                result = result.concat(outputs);
                break;
            case "${FLAGS}":
                if(!this.m_syntax || !this.m_syntax.Flag)
                    throw new Error(`${this.m_name} has no syntax for Flag`);
                subst = task.GetFlags(this.m_role, this.m_syntax.Flag);
                if(subst)
                    result = result.concat(subst);
                break;
            case "${DEFINES}":
                if(!this.m_syntax.Define)
                    throw new Error(`${this.m_name} has no syntax for Define`);
                subst = task.GetDefines(this.m_syntax.Define,
                                        this.m_syntax.DefineNoVal);
                if(subst)
                    result = result.concat(subst);
                break;
            case "${SEARCHPATHS}":
                if(!this.m_syntax.Searchpath)
                    throw new Error(`${this.m_name} has no Searchpath syntax`);
                subst = task.GetSearchpaths(this.m_role, 
                                    this.m_syntax.Searchpath);
                if(subst)
                    result = result.concat(subst);
                break;
            case "${LIBS}":
                if(!this.m_syntax.Lib)
                    throw new Error(`${this.m_name} has no syntax for Lib`);
                subst = task.GetLibs(this.m_syntax.Lib);
                if(subst)
                    result = result.concat(subst);
                break;
            default:
                {
                    while(w.indexOf("${") != -1)
                    {
                        let old = w;
                        w = task.Interpolate(w);
                        if(w == old)
                        {
                            jsmk.WARNING(`failed interpolate ${old} ` + JSON.stringify(fallbackMap, null, 2));
                            break;
                        }
                    }
                    result.push(w); 
                }
                break;
            }
        }
        // console.log(result);
        return result;
    }

    makeWork(task, invoc, taskDir, outfile, nm, envMap)
    {
        let self = this;
        let w  = new Promise( (resolve,reject) => {
            jsmk.path.normalizeArgv(invoc, taskDir);
            jsmk.path.normalizeEnv(envMap);
            envMap.PATH = process.env.PATH; // path is used by spawn
            if(envMap.INCLUDE)
            {
                //jsmk.NOTICE("INCLUDE:" + envMap.INCLUDE);
                //jsmk.NOTICE("PATH:" + envMap.PATH);
            }

            let shortOut = outfile ? jsmk.path.basename(outfile) : "<nooutput>";
            let shorthand = `${task.GetTool().GetRole()} ${shortOut} (${taskDir})`;
            jsmk.LogSubProcess(invoc, shorthand);
            if(this.useSpawn) 
            {
                // for LiveOutput
                // console.log("using spawn");
                let stderr = [];
                let stdout = [];
                envMap.PYTHONUNBUFFERED = 1;
                jsmk.INFO("Live output begins...");
                this.childProcess = spawn(invoc[0], invoc.slice(1),
                {
                    cwd: taskDir,
                    env: envMap
                })
                this.childProcess.stdout.on("data", (data) =>
                {
                    let str = data.toString();
                    process.stdout.write(jsmk.colors.apply("cyan",  str));
                    // console.log(jsmk.colors.apply("cyan",  str));
                    stdout.push(str);
                });
                this.childProcess.stderr.on("data", (data) =>
                {
                    let str = data.toString();
                    process.stderr.write(jsmk.colors.apply("lightred",  str));
                    stderr.push(str);
                });
                this.childProcess.on("exit", (errcode) =>
                {
                    jsmk.INFO("Live output ends.");
                    let errstr = self.filterOutput("stderr", stderr.join(""), task, outfile);
                    let outstr = self.filterOutput("stdout", stdout.join(""), task, outfile);
                    if(errstr && errstr.length)
                    {
                        console.log("\nstderr:",
                            jsmk.colors.apply("lightred",  errstr));
                    }
                    if(outstr && outstr.length)
                    {
                        console.log("\nstdout:", 
                            jsmk.colors.apply("cyan",  outstr));
                    }
                    self.analyzeError(errcode, errstr, outstr,
                                      outfile, resolve, reject);
                });
            }
            else
            {
                this.childProcess =
                    execFile(invoc[0], invoc.slice(1), {
                        maxBuffer:1024*1024,
                        cwd: taskDir,
                        env: envMap
                    }, 
                    function(errcode, stderr, stdout)
                    {
                        stderr = self.filterOutput("stderr", stderr, task, outfile);
                        if(stderr && stderr.length)
                        {
                            console.log("\nstderr:",
                                jsmk.colors.apply("lightred",  stderr));
                        }
                        stdout = self.filterOutput("stdout", stdout, task,outfile);
                        if(stdout && stdout.length)
                        {
                            console.log("\nstdout:", 
                                jsmk.colors.apply("cyan",  stdout));
                        }
                        self.analyzeError(errcode, stderr, stdout,
                                      outfile, resolve, reject);
                    });
            }
        });
        w._name = nm;
        return w;
    }

    // filterOutput can be overridden by subclasses
    filterOutput(chan, txt, task, outfile)
    {
        return txt;
    }

    analyzeError(errcode, stderr, stdout, outfile, resolve, reject)
    {
        // some programs aren't well-behaved wrt errcode and stderr.
        //   in that case we need to scan stdout & stderr for
        //   error signals.  Individual tools may wish to override this method.
        if(errcode)
        {
            // jsmk.WARNING(`${errcode} ${stdout} ${stderr}`);
            reject(errcode);
        }
        else
        {
            if(outfile)
                jsmk.file.touch(outfile);  // updates timestamp cache
            resolve(stdout);
        }
    }

    EndStage(stage, task)
    {
    }
}

exports.Tool = Tool_Cli;
