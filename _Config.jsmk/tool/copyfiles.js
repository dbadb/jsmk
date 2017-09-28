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
    // GenerateWork is a generator (ie: issues yield) of Promises
    *GenerateWork(stage, task, inputs, outputs)
    {
        if(inputs.length !== outputs.length)
            throw new Error("CopyFiles requires equal inputs and outputs");

        let cwd = task.GetWorkingDir();
        let outputdir = task.GetOutputDir();
        jsmk.path.makedirs(outputdir);

        let config = task.GetToolConfig();
        let filter = (config && config.filter) ? config.filter : null;
        for(let i=0;i<inputs.length;i++)
        {
            let infile = inputs[i];
            let outfile = outputs[i];
            if(this.outputIsDirty(outfile, infile, cwd))
                yield this.makeWork(infile, outfile, filter);
        }
    }

    makeWork(infile, outfile, filter)
    {
        let w  = new Promise( (resolve,reject) => {
            let istream = fs.createReadStream(infile, {encoding: "utf8"});
            istream.on("error", reject);
            let ostream = fs.createWriteStream(outfile, {encoding: "utf8"});
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
