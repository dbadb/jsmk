/* global jsmk */
let Tool = require("./tool.js").Tool;
let execFile = require("child_process").execFile;

class Tool_Cli extends Tool
{
    constructor(toolset, name, config)
    {
        super(toolset, name, config);
        if(Array.isArray(config.Invocation))
            this.m_invocation = config.Invocation;
        else
            throw new Error("Tool_cli: Invocation must be an array");
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
    }

    BeginStage(stage, task)
    {
    }

    *GenerateWork(stage, task, inputs, outputs)
    {
        if(stage !== this.m_actionStage) return;
        // jsmk.INFO(this.m_name + " GenerateWork " + stage + " " +
        //          this.m_semantics+" "+inputs.length+"-"+outputs.length);
        let cwd = task.GetWorkingDir();
        let tnm = task.GetName();
        let outputdir = task.GetOutputDir();
        jsmk.path.makedirs(outputdir);
        let invoc;
        let envmap = {};
        Object.assign(envmap, process.env);
        Object.assign(envmap, task.EnvMap);
        switch(this.m_semantics)
        {
        case Tool.Semantics.NoneToNone:
            invoc = this.getInvocation(task, null, null);
            yield this.makeWork(invoc, cwd, null, tnm, envmap);
            break;
        case Tool.Semantics.OneToNone:
            // since we have no outputs, we always run this tool
            invoc = this.getInvocation(task, inputs, []);
            yield this.makeWork(invoc, cwd, null, tnm, envmap);
            break;
        case Tool.Semantics.ManyToOne:
            if(this.outputIsDirty(outputs[0], inputs, cwd))
            {
                invoc = this.getInvocation(task, inputs, outputs);
                yield this.makeWork(invoc, cwd, outputs[0], tnm, envmap);
            }
            break;
        case Tool.Semantics.OneToOne:
        case Tool.Semantics.ManyToMany:
            for(let i=0;i<inputs.length;i++)
            {
                let input = inputs[i];
                let output = outputs[i];
                if(this.outputIsDirty(output, input, cwd))
                {
                    invoc = this.getInvocation(task, [input], [output]);
                    let tnmt = `${tnm}_${i}/${inputs.length}`;
                    yield this.makeWork(invoc, cwd, output, tnmt, envmap);
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
            arglist = [];
        let result = [argc0];
        let subst;
        let fallbackMap =
        {
            SRCFILE: inputs ? inputs[0] : "",
            SRCFILEBASENOEXT: inputs? jsmk.path.basenameNoExt(inputs[0]) : "",
            DSTFILE: outputs ? outputs[0] : "",
            BUILTDIR: task.GetOutputDir(),
        };
        task.MergeBuildVars(fallbackMap);
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
                if(!this.m_syntax.Flag)
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
                    throw new Error(`${this.m_name} has no syntax for Searchpath`);
                subst = task.GetSearchpaths(this.m_role, this.m_syntax.Searchpath);
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
                result.push(jsmk.Interpolate(w, fallbackMap));
                break;
            }
        }
        return result;
    }

    makeWork(invoc, cwd, outfile, nm, envMap)
    {
        let self = this;
        let w  = new Promise( (resolve,reject) => {
            jsmk.LogSubProcess(invoc);
            this.childProcess =
                execFile(invoc[0], invoc.slice(1), {
                    maxBuffer:1024*1024,
                    cwd: cwd,
                    env: envMap
                }, function(errcode, stderr, stdout)
                {
                    stderr = self.filterOutput("stderr", stderr);
                    if(stderr && stderr.length)
                    {
                        console.log("\nstderr:",
                            jsmk.colors.apply("lightred",  stderr));
                    }
                    stdout = self.filterOutput("stdout", stdout);
                    if(stdout && stdout.length)
                    {
                        console.log("\nstdout:", jsmk.colors.apply("cyan",  stdout));
                    }
                    self.analyzeError(errcode, stderr, stdout,
                                      outfile, resolve, reject);


                });
        });
        w._name = nm;
        return w;
    }

    // filterOutput can be overridden by subclasses
    filterOutput(chan, txt)
    {
        return txt;
    }

    analyzeError(errcode, stderr, stdout, outfile, resolve, reject)
    {
        // some programs aren't well-behaved wrt errcode and stderr.
        //   in that case we need to scan stdout & stderr for
        //   error signals.  Individual tools may wish to override this method.
        if(errcode)
            reject(stderr);
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
