let Tool = require("./tool.js").Tool;
let execFile = require("child_process").execFile;

class Tool_Cli extends Tool
{
    constructor(toolset, name, config)
    {
        super(toolset, name, config);
        this.m_invocation = config.Invocation;
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
        let cwd = task.GetWorkingDir();
        if(stage !== this.m_actionStage) return;
        // jsmk.INFO(this.m_name + " GenerateWork " + stage + " " +
        //          this.m_semantics + " " + inputs.length + "-" + outputs.length);
        let invoc;
        switch(this.m_semantics)
        {
        case Tool.Semantics.OneToNone:
            invoc = this.getInvocation(task, inputs, []);
            yield this.makeWork(invoc, cwd);
            break;
        case Tool.Semantics.ManyToOne:
            invoc = this.getInvocation(task, inputs, outputs);
            yield this.makeWork(invoc, cwd);
            break;
        case Tool.Semantics.OneToOne:
        case Tool.Semantics.ManyToMany:
            for(let i=0;i<inputs.length;i++)
            {
                let input = inputs[i];
                let output = outputs[i];
                invoc = this.getInvocation(task, [input], [output]);
                yield this.makeWork(invoc, cwd);
            }
            break;
        }
    }

    // getInvocation scans the tool-specific invocation for
    //  special patterns that require substitution.
    //  return value is a list of args.
    getInvocation(task, inputs, outputs)
    {
        let argc0 = this.m_invocation[0];
        let arglist = this.m_invocation[1].split(" ");
        let result = [argc0];
        let subst;
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
                    throw(`${this.m_name} has no syntax for Flag`);
                subst = task.getFlags(this.m_syntax.Flag);
                if(subst)
                    result = result.concat(subst);
                break;
            case "${DEFINES}":
                if(!this.m_syntax.Define)
                    throw(`${this.m_name} has no syntax for Define`);
                subst = task.getDefines(this.m_syntax.Define,
                                        this.m_syntax.DefineNoVal);
                if(subst)
                    result = result.concat(subst);
                break;
            case "${INCLUDES}":
                if(!this.m_syntax.Include)
                    throw(`${this.m_name} has no syntax for Include`);
                subst = task.getIncludes(this.m_syntax.Include);
                if(subst)
                    result = result.concat(subst);
                break;
            default:
                result.push(w);
                break;
            }
        }
        return result;
    }

    makeWork(invoc, cwd)
    {
        let self = this;
        return new Promise( (resolve,reject) => {
            let istr = invoc.join(" ");
            if(0 && istr.length > 75)
                istr = istr.slice(0, 75) + "....";
            let args = invoc.slice(1);
            jsmk.NOTICE(istr);
            // jsmk.NOTICE(args);
            this.childProcess =
                execFile(invoc[0], args, {
                        maxBuffer:1024*1024,
                        cwd: cwd
                    },
                    function(errcode, stderr, stdout)
                    {
                        if(stderr.length)
                            console.log("\nstderr:", stderr);
                        if(stdout.length)
                            console.log("stdout:", stdout);
                        self.analyzeError(errcode, stderr, stdout,
                                          resolve, reject);

                    });
        });
    }

    analyzeError(errcode, stderr, stdout, resolve, reject)
    {
        // some programs aren't well-behaved wrt errcode and stderr.
        //   in that case we need to scan stdout & stderr for
        //   error signals.  Individual tools may wish to override this method.
        if(errcode)
            reject(stderr);
        else
            resolve(stdout);
    }


    EndStage(stage, task)
    {
    }

}

exports.Tool = Tool_Cli;
