/* global jsmk */
let Tool = jsmk.Require("tool.js").Tool;
let fs = require("fs");
let fse = require("fs-extra");

class CopyFiles extends Tool
{
    constructor(toolset, vers, cfg)
    {
        let config = {
            Role: Tool.Role.Copy,
            Semantics: Tool.Semantics.ManyToMany,
            ActionStage: cfg ? cfg.ActionStage : "build",
        };

        super(toolset, "jsmk/copyfile", config);
    }

    ConfigureTaskSettings(task, config)
    {
        super.ConfigureTaskSettings(task);
        if(config.inputs && config.installdir)
        {
            let rootdir;
            if(config.installroot)
                rootdir = task.Interpolate(config.installroot);
            else
                rootdir = task.EvaluateBuildVar("InstallDir");
            // console.log("rootdir " + rootdir);
            let idir = jsmk.path.join(rootdir, config.installdir);
            let outputs = [];
            for(let input of config.inputs)
            {
                let infile = jsmk.path.basename(input);
                let outfile = jsmk.path.join(idir, infile);
                if(config.installext)
                {
                    let pathobj = jsmk.path.parse(outfile);
                    pathobj.ext = config.installext;
                    pathobj.base = null;
                    outfile = jsmk.path.format(pathobj);
                }
                outputs.push(outfile);
            }
            config.outputs = outputs;
            // let inputs and outputs remain on config
            delete config.installdir;
            delete config.installext;

            // jsmk.DEBUG(this.m_actionStage + " to " + idir);
            // (installdir is usually to _Root/toolset/Product/...)
        }
    }

    // GenerateWork is a generator (ie: issues yield) of Promises
    * GenerateWork(doit, task, inputs, triggers, outputs)
    {
        if(!doit) return;

        if(inputs.length !== outputs.length)
            throw new Error("CopyFiles requires equal inputs and outputs");

        if(!triggers)
            triggers = [];

        let cwd = task.GetWorkingDir();
        let outputdir = task.GetOutputDir();

        console.log("copyfiles to: " + outputdir);

        jsmk.path.makedirs(outputdir); // often redundant

        let config = task.GetToolConfig();
        let filter = (config && config.filter) ? config.filter : null;
        for(let i = 0; i < inputs.length; i++)
        {
            let infile = inputs[i];
            let outfile = outputs[i];
            if(this.outputIsDirty(outfile, triggers.concat(infile), cwd))
                yield this.makeWork(cwd, infile, outfile, filter);
        }
    }

    makeWork(cwd, infile, outfile, filter) // XXX: filtercontents, filterfiles
    {
        if(!jsmk.path.isAbsolute(infile))
            infile = jsmk.path.join(cwd, infile);

        jsmk.INFO(`copy from: ${infile} ${filter?'(filtered)':''}`);
        jsmk.INFO(`       to: ${outfile}`);
        let w;
        if(!filter)
        {
            // handles permissions and subtrees
            w = fse.copy(infile, outfile); // returns a promise
        }
        else
        {
            w = new Promise((resolve, reject) =>
            {
                jsmk.path.makedirs(jsmk.path.dirname(outfile));
                let istream = fs.createReadStream(infile, { encoding: "binary" });
                istream.on("error", reject);
                let ostream = fs.createWriteStream(outfile, { encoding: "binary" });
                ostream.on("error", reject);
                if(!filter)
                {
                    ostream.on("close", resolve);
                    istream.pipe(ostream);
                }
                else
                {
                    istream.on("end", () =>
                    {
                        ostream.end();
                        jsmk.file.touch(outfile); // updates timestamp cache
                        resolve();
                    });
                    istream.on("data", (chunk) =>
                    {
                        ostream.write(filter(infile, chunk));
                    });
                }
            });
        }
        w._name = "copyfile";
        return w;
    }
}

exports.CopyFiles = CopyFiles;
exports.Tool = CopyFiles;