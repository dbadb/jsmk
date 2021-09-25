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
        let actionStage = task.GetActionStage();
        if(config.inputs && config.installdir)
        {
            let rootdir;
            if(config.installroot)
                rootdir = task.Interpolate(config.installroot);
            else
            {
                switch(actionStage)
                {
                case "package":
                    rootdir = task.EvaluateBuildVar("PackageDir");
                    break;
                case "install":
                    rootdir = task.EvaluateBuildVar("InstallDir");
                    break;
                default:
                    rootdir = task.EvaluateBuildVar("BuiltDir");
                    break;
                }
            }

            let idir = jsmk.path.join(rootdir, config.installdir);
            let outputs = [];
            if(!Array.isArray(config.inputs))
            {
                throw new Error(task.GetName() + ".inputs must be an array");
            }
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
            if(actionStage == "package")
            {
                jsmk.NOTICE("copyfiles " + 
                    config.inputs + " to " + config.outputs);
            }
            config.outputs = outputs;
            config.rootdir = rootdir;
            // let inputs and outputs remain on config
            delete config.installdir;
            delete config.installext;

            // jsmk.NOTICE(this.m_actionStage + " to " + idir);
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
        let params = task.GetParameters();
        for(let i = 0; i < inputs.length; i++)
        {
            let infile = inputs[i];
            if(!jsmk.path.isAbsolute(infile))
                infile = jsmk.path.join(cwd, infile);
            let outfile = outputs[i];
            let dirty = this.outputIsDirty(outfile, triggers.concat(infile), cwd);
            let isdir = this.isDir(infile);
            if(dirty || isdir)
            {
                yield this.makeWork(cwd, infile, outfile, contentfilter, isdir, 
                    params);
            }
        }
    }

    makeWork(cwd, infile, outfile, contentfilter, isdir, params) // XXX: filtercontents, filterfiles
    {
        let w;
        let ignore = params ? params.ignore : null;
        let quiet = params ? params.quiet : false;
        if(ignore && ignore.test(infile))
        {
            if(!quiet)
                jsmk.INFO(`ignoring: ${infile}`);
            w = new Promise((resolve, reject) => { resolve(0); });
            w._name = "copyfile (ignore)";
            return w;
        }
        if(!isdir)
        {
            jsmk.INFO(`copy from: ${infile} ${contentfilter?'(filtered)':''}`);
            jsmk.INFO(`       to: ${outfile}`);
        }

        if(!contentfilter)
        {
            // handles permissions and subtrees
            let istat = fs.lstatSync(infile);
            if(istat.isDirectory())
            {
                return this.deepCopy(infile, outfile, params); // single task
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

    deepCopy(indir, outdir, params)
    {
        let ignore = params ? params.ignore : null;
        let quiet = params ? params.quiet : false;
        return new Promise((resolve, reject) =>
        {
            let inroot = indir;
            let outroot = outdir;
            let nerr = 0,
                nfiles = 0,
                ndirs = 0;
            let deferredmsg = `deepCopy \n\tfrom: ${indir}\n\tto: ${outdir}`;
            let cfg = {};
            // console.log("klaw: " + item.path);
            /* filtering is busted
            if(ignore)
            {
                if(ignore)
                    jsmk.DEBUG("deepCopy filtering with " + ignore.toString());
                cfg = 
                {
                    filter: (fpath) =>
                    {
                        let x = ignore.test(fpath) || false;
                        if(x) 
                            jsmk.INFO("deepCopy ignoring " + fpat);
                        else
                            jsmk.INFO("deepCopy not ignoring " + fpath);
                        return x;
                    },
                    queueMethod: "pop"
                }
            }
            */
            // traverse the input tree, items have already been stated
            // jsmk.INFO(deferredmsg);
            klaw(indir, cfg)
            .on("data", (item) =>
            {
                // console.log("deepCopy.data " + item.path);
                let subpath = item.path.substr(inroot.length + 1);
                if(ignore && ignore.test(subpath))
                {
                    if(!quiet)
                        jsmk.INFO("deepCopy ignoring " + subpath);
                    return;
                }
                let dirty = false;
                let outpath = path.join(outroot, subpath);
                if(!fs.existsSync(outpath))
                {
                    dirty = true;
                }
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
                        if(!quiet)
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
