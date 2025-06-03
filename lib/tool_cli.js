/* global jsmk */
let Tool = require("./tool.js").Tool;
let {execFile, exec, spawn} = require("child_process");

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

    BeginStage(stage, task)
    {
    }

    // usually invoked by task in the process of GenerateWork
    // prior to it invoking this.GenerateWork.
    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }

    // this is invoked by Task
    *GenerateWork(doit, task, inputs, triggers, outputs)
    {
        if(!doit) 
            return; 
        // handled here since our return of empty work is magically handled
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
        let semantics = this.m_semantics;
        if(semantics == Tool.Semantics.CustomTrigger)
        {
            let s = task.GetBuildVar("Semantics");
            semantics = s || semantics;
        }
        switch(semantics)
        {
        case Tool.Semantics.CustomTrigger:
            // fall-through
        case Tool.Semantics.NoneToNone:
            invoc = this.getInvocation(task, null, null);
            yield this.makeWork(task, invoc, taskDir, null, tnm, envmap);
            break;
        case Tool.Semantics.OneToNone:
            // since we have no outputs, we always run this tool
            invoc = this.getInvocation(task, inputs, null);
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
        default:
            jsmk.WARNING("Unimplemented tool semantics: " + this.m_semantics);
        }
    }

    // getInvocation scans the tool-specific invocation for
    //  special patterns that require substitution.
    //  return value is a list of args.
    // NB: a tool's settings are combined with the tasks 
    // via: tool.ConfigureTaskSettings prior to getInvocation.
    getInvocation(task, inputs, outputs)
    {
        // console.log(task.m_name, inputs);
        let argc0 = this.m_invocation[0], arglist;
        if(this.m_invocation.length == 2)
            arglist = this.m_invocation[1].split(" ");
        else
            arglist = this.m_invocation.slice(1);
        let result;
        if(arglist.length == 0)
        {
            // shell-script or custom-cmd case: ${ARGUMENTS}
            result = [];
            arglist = this.m_invocation;
        }
        else
            result = [argc0];
        let subst;
        let input = inputs ? inputs[0] : "";
        let output = outputs ? outputs[0] : "";
        let fallbackMap =
        {
            SRCFILES: inputs,
            SRCFILE: input,
            SRCFILEBASENOEXT: jsmk.path.basenameNoExt(input),
            DSTFILE: output,
            DSTFILES: outputs,
            DSTFILENOEXT: jsmk.path.stripext(output, false),
            DSTFILEBASENOEXT: jsmk.path.basenameNoExt(output, false),
            BUILTDIR: task.GetOutputDir(),
        };
        // lays fallbackMap atop task (XXX: revisit)
        task.MergeBuildVars(fallbackMap); 
        for(let i=0; i < arglist.length; i++)
        {
            let w = arglist[i];
            if(!w) continue;
            switch(w)
            {
            case "${ARGUMENTS}": // used by CustomTriggered script tools
                arglist.push(...task.GetBuildVar("ARGUMENTS"));
                // so ARGUMENT elements can be substituted
                break;
            case "${SRCFILE}":
                result.push(input);
                break;
            case "${SRCFILES}":
                if(inputs)
                {
                    result.push(...inputs);
                    // console.log("SRCFILES: " + inputs);
                }
                break;
            case "${DSTFILE}":
                result.push(output);
                break;
            case "${DSTFILES}":
                if(outputs)
                    result.push(...outputs);
                break;
            case "${FLAGS}":
                if(!this.m_syntax || !this.m_syntax.Flag)
                    throw new Error(`${this.m_name} has no syntax for Flag`);
                subst = task.GetFlags(this.m_role, this.m_syntax.Flag);
                // jsmk.NOTICE(`tool_cli getflags: ${this.m_role}: ${subst}`);
                if(subst)
                    result.push(...subst);
                break;
            case "${DEFINES}":
                if(!this.m_syntax.Define)
                    throw new Error(`${this.m_name} has no syntax for Define`);
                subst = task.GetDefines(this.m_syntax.Define,
                                        this.m_syntax.DefineNoVal);
                if(subst)
                    result.push(...subst);
                break;
            case "${SEARCHPATHS}":
                if(!this.m_syntax.Searchpath)
                    throw new Error(`${this.m_name} has no Searchpath syntax`);
                subst = task.GetSearchpaths(this.m_role, 
                                    this.m_syntax.Searchpath);
                if(subst)
                    result.push(...subst);
                break;
            case "${LIBS}": // NB: this is for syslibs and framworks.
                            // non-syslibs are dependendencies and are
                            // appended to inputs.
                if(this.m_syntax.Framework)
                {
                    subst = task.GetFrameworks(this.m_syntax.Framework);
                    if(subst)
                        result.push(...subst);
                }
                if(!this.m_syntax.Lib)
                    throw new Error(`${this.m_name} has no syntax for Lib`);
                subst = task.GetLibs(this.m_syntax.Lib);
                if(subst)
                    result.push(...subst);
                break;
            default:
                {
                    while(w.indexOf("${") != -1) // }
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
                let opts = {
                    maxBuffer:1024*1024,
                    cwd: taskDir,
                    env: envMap
                };
                let handleStd = function(errcode, stderr, stdout)
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
                };
                if(invoc[0].endsWith(".cmd") || invoc[0].endsWith(".bat"))
                {
                    // must now use .exec with shell
                    // XXX: invoc.join may be inadequate, but works for eg npm.cmd
                    this.childProcess = exec(invoc.join(" "), opts, handleStd);
                }
                else
                {
                    this.childProcess = execFile(invoc[0], invoc.slice(1), opts, handleStd);
                }
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

    // subclasses should override this if they can do a better job
    // than our simple scheme.
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
            if(stdout.indexOf("Fatal error") != -1) // for node scripts
            {
                // jsmk.ERROR(stdout);
                reject(-666);
            }
            else
            {
                if(outfile)
                    jsmk.file.touch(outfile);  // updates timestamp cache
                resolve(stdout);
            }
        }
    }

    EndStage(stage, task)
    {
    }
}

exports.Tool = Tool_Cli;
