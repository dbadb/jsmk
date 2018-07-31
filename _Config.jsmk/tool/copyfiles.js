/* global jsmk */
let Tool = jsmk.Require("tool.js").Tool;
let fs = require("fs");

class CopyFiles extends Tool
{
    constructor(toolset, vers, cfg)
    {
        let config =
        {
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
            let idir = jsmk.path.join(task.EvaluateBuildVar("InstallDir"), 
                                        config.installdir);
            let outputs = [];
            for(let input of config.inputs)
            {
                let output = jsmk.path.join(idir, jsmk.path.basename(input));
                outputs.push(output);
            }
            config.outputs = outputs;
            // let inputs and outputs remain on config
            delete config.installdir;
        }
    }

    // GenerateWork is a generator (ie: issues yield) of Promises
    *GenerateWork(stage, task, inputs, triggers, outputs)
    {
        if(stage !== this.m_actionStage) return;

        if(inputs.length !== outputs.length)
            throw new Error("CopyFiles requires equal inputs and outputs");

        if(!triggers)
            triggers = [];

        let cwd = task.GetWorkingDir();
        let outputdir = task.GetOutputDir(); 
        jsmk.path.makedirs(outputdir); // probably unneeded

        let config = task.GetToolConfig();
        let filter = (config && config.filter) ? config.filter : null;
        for(let i=0;i<inputs.length;i++)
        {
            let infile = inputs[i];
            let outfile = outputs[i];
            if(this.outputIsDirty(outfile, triggers.concat(infile), cwd))
                yield this.makeWork(infile, outfile, filter);
        }
    }

    makeWork(infile, outfile, filter)
    {
        let w  = new Promise( (resolve,reject) => {
            jsmk.INFO(`copy from: ${infile}`);
            jsmk.INFO(`       to: ${outfile}`);
            jsmk.path.makedirs(jsmk.path.dirname(outfile));
            let istream = fs.createReadStream(infile, {encoding: "binary"});
            istream.on("error", reject);
            let ostream = fs.createWriteStream(outfile, {encoding: "binary"});
            ostream.on("error", reject);
            if(!filter)
            {
                ostream.on("close", resolve);
                istream.pipe(ostream);
            }
            else
            {
                istream.on("end", () => {
                    ostream.end();
                    jsmk.file.touch(outfile);  // updates timestamp cache
                    resolve();
                });
                istream.on("data", (chunk) => {
                    ostream.write(filter(infile, chunk));
                });
            }
        });
        w._name = "copyfile";
        return w;
    }
}

exports.CopyFiles = CopyFiles;
exports.Tool = CopyFiles;
