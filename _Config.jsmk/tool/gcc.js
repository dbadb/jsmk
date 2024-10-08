/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

class GCC extends ToolCli
{
    constructor(ts, nm, arg0, arglist)
    {
        if(!nm)
            nm = "compiler/gcc";
        if(!arg0)
            arg0 = "gcc";
        if(!arglist)
        {
            arglist = ["${FLAGS}", 
                       "${DEFINES}", 
                       "${SEARCHPATHS}",
                       "${SRCFILE}", 
                       "-o", "${DSTFILE}", 
                      ];
        }
        arglist = [arg0].concat(arglist);
        let config =
        {
            Role: ToolCli.Role.Compile,
            Semantics: ToolCli.Semantics.ManyToMany,
            DstExt: "o",
            ActionStage: "build",
            Invocation: arglist,
            Syntax:
            {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
        };
        super(ts, nm, config);
        this.target = (nm.indexOf("+") == -1) ? "c" : "cpp";
        this.defaultStd = {
            "cpp": "c++14", 
            "c": null,
        }[this.target];
        this.AddFlags(this.GetRole(),
        [
           "-MMD", // for mkdep
        ]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        let flags = [];

        switch(this.target)
        {
        case "c":
            {
                let std = task.BuildVars.CStd || this.defaultStd;
                if(std)
                    flags.push(`-std=${std}`);
            }
            break;
        case "cpp":
            {
                let std = task.BuildVars.CppStd || this.defaultStd;
                if(std)
                    flags.push(`-std=${std}`);
            }
            break;
        }

        // Optimize for size. -Os enables all -O2 optimizations except 
        // those that often increase code size.  A Project/Root can
        // specify a default optimization regardless of Deployment.
        switch(task.BuildVars.OPTIMIZATION)
        {
        case "Size":
            flags.push("-Os");
            break;
        case "Speed":
            flags.push("-O3");
            break;
        case "Mixed":
            flags.push("-O2");
            break;
        case "None":
            flags.push("-O0"); // no-opt -> default
            break;
        default:
        case "Contextual":
            break;
        }
        switch(task.BuildVars.Deployment)
        {
        case "debug":
            flags.push("-g");
            break;
        case "release":
            if(!task.BuildVars.OPTIMIZATION)
                flags.push("-O3");
            break;
        }
        if(flags.length)
            task.AddFlags(this.GetRole(), flags);
    }

    outputIsDirty(output, inputs, cwd)
    {
        let dirty = super.outputIsDirty(output, inputs, cwd);
        if(!dirty)
        {
            // also look for MMD output to see if any dependencies have changed

            let depfileTxt = jsmk.file.read(jsmk.file.changeExtension(output, "d"));
            if(depfileTxt)
            {
                let pat = /(?:[^\s]+\\ [^\s]+|[^\s]+)+/g;
                // pat looks for filenames, potentially with embedded spaces.
                // This also selects for line-continuation "\\" so we need
                // to filter that.
                // First line is the dependent file, so we slice it off.
                let files = depfileTxt.match(pat).filter((value)=>{
                    if(value[value.length-1] == ":")
                        return false;
                    else
                        return (value.length > 1);
                }).map((value)=>{
                    // Program\ Files -> Program Files
                    return value.replace(/\\ /g, " ");
                });
                return super.outputIsDirty(output, files, cwd);
            }
        }
        return dirty;
    }
}

class GPP extends GCC
{
    constructor(toolset)
    {
        super(toolset, "g++", "g++");
    }
}

exports.GCC = GCC;
exports.GPP = GPP;
