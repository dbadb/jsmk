/* global jsmk */
let Tool = jsmk.Require("tool.js").Tool;
let fs = require("fs");
let fse = require("fs-extra");
let klaw = require("klaw");
let path = require("path");

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
        // commented out due when OutputDir != installroot
        // let outputdir = task.GetOutputDir();
        //  console.log("copyfiles to: " + outputdir);
        // jsmk.path.makedirs(outputdir); // often redundant

        let config = task.GetToolConfig();
        let contentfilter = (config && config.filter) ? config.filter : null;
        for(let i = 0; i < inputs.length; i++)
        {
            let infile = inputs[i];
            if(!jsmk.path.isAbsolute(infile))
                infile = jsmk.path.join(cwd, infile);
            let outfile = outputs[i];
            let dirty = this.outputIsDirty(outfile, triggers.concat(infile), cwd);
            let isdir = this.isDir(infile);
            if(dirty || isdir)
                yield this.makeWork(cwd, infile, outfile, contentfilter, isdir);
        }
    }

    makeWork(cwd, infile, outfile, contentfilter, isdir) // XXX: filtercontents, filterfiles
    {
        if(!isdir)
        {
            jsmk.INFO(`copy from: ${infile} ${contentfilter?'(filtered)':''}`);
            jsmk.INFO(`       to: ${outfile}`);
        }

        let w;
        if(!contentfilter)
        {
            // handles permissions and subtrees
            let istat = fs.lstatSync(infile);
            if(istat.isDirectory())
            {
                return this.deepCopy(infile, outfile); // single task
            }
            else
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
                if(!contentfilter)
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
                        ostream.write(contentfilter(infile, chunk));
                    });
                }
            });
        }
        w._name = "copyfile";
        return w;
    }

    deepCopy(indir, outdir)
    {
        return new Promise((resolve, reject) =>
        {
            let inroot = indir;
            let outroot = outdir;
            let nerr = 0,
                nfiles = 0,
                ndirs = 0;
            let deferredmsg = `deepCopy \n\tfrom: ${indir}\n\tto: ${outdir}`;

            // traverse the input tree, items have already been stated
            klaw(indir).on("data", (item) =>
                {
                    // console.log("klaw: " + item.path);
                    let dirty = false;
                    let subpath = item.path.substr(inroot.length + 1);
                    let outpath = path.join(outroot, subpath);
                    if(!fs.existsSync(outpath))
                        dirty = true;
                    else
                    if(!item.stats.isDirectory())
                    {
                        let ostat = fs.lstatSync(outpath);
                        if(item.stats.mtime > ostat.mtime)
                            dirty = true;
                        nfiles++;
                    }
                    else
                    {
                        // this is a directory and the output dir exists
                        // let's make sure that the outdir's timestamp is
                        // >= indirs. Here is a directory "touch".
                        // nb: this doesn't make it dirty
                        ndirs++;
                        let now = new Date();
                        try
                        {
                            fs.utimesSync(outpath, now, now);
                        }
                        catch (err)
                        {
                            jsmk.WARNING(err);
                        }
                    }
                    if(dirty)
                    {
                        if(deferredmsg)
                        {
                            jsmk.INFO(deferredmsg);
                            deferredmsg = null;
                        }
                        if(item.stats.isDirectory())
                        {
                            // dst parent directory may not exist
                            jsmk.INFO("mkdir " + subpath);
                            fs.mkdirSync(outpath, { recursive: true });
                        }
                        else
                        {
                            jsmk.INFO(`copy to ${subpath}`);
                            try
                            {
                                fs.copyFileSync(item.path, outpath);
                            }
                            catch (err)
                            {
                                nerr++;
                                jsmk.WARNING(`failed to copy ${input} to ${outpath} (${err})`);
                            }
                        }
                    }
                })
                .on("end", () =>
                {
                    // jsmk.INFO(`copyfiles checked: ${nfiles}/${ndirs} below ${indir}`);
                    if(nerr)
                        reject(nerr);
                    else
                        resolve();
                });
        });
    }
}

exports.CopyFiles = CopyFiles;
exports.Tool = CopyFiles;
