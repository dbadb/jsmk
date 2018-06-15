/* global jsmk */
let fs = require("fs");  // fs: File System
let path = require("path");
let glob = require("glob").glob.sync;
let os = require("os");

// Interpolate: uses provided val to substutes patterns like: ${VAR}
// val can either be a map, or a function.
//  If a value isn't found vai, we silently leave it unsubstituted.
let Interpolate = function(str, val)
{
    if(typeof val === "object")
    {
        return str.replace(/\$\{\w+\}/g,
            function(match)
            {
                let key = match.slice(2, -1);
                let result = val[key];
                if (result === undefined)
                    return match;
                else
                    return result;
            });
    }
    else  // presume it's a function
    {
        return str.replace(/\$\{\w+\}/g,
            function(match)
            {
                let key = match.slice(2, -1);
                let ret = val(key);
                if(ret === key)
                    return match;
                else
                    return ret;
            });
    }
};

let InterpolateWithCallback = function(str, callback)
{
    return str.replace(/\$\{\w+\}/g, callback);
};

let FixupPath = function(str) {
    return str.replace(/\\/g, "/");
};

let MakeDirs = function(pathname, made) {
    let mode = parseInt("0777", 8) & (~process.umask());
    if (!made) made = null;

    pathname = path.resolve(pathname);

    try {
        fs.mkdirSync(pathname, mode);
        made = made || pathname;
    }
    catch (err0) {
        switch (err0.code) {
        case "ENOENT" :
            made = MakeDirs(path.dirname(pathname), made);
            MakeDirs(pathname, made);
            break;

        default:
            // In the case of any other error, just see if there's a dir
            // there already.
            try
            {
                let stat = fs.statSync(pathname);
                if (!stat.isDirectory())
                    throw err0;
            }
            catch (err1)
            {
                throw err0; // re-throw
            }
            break;
        }
    }
    return made;
};

// http://misc.flogisoft.com/bash/tip_colors_and_formatting
// for rgb colors with black bg
//  [38;5;$c then [0m where c:[0--15 are primaries, then 16-231, then gray]
let AnsiColors =  // foreground only
{
    red: "\u001b[0;31m",
    lightred: "\u001b[1;31m",
    green: "\u001b[0;32m",
    lightgreen: "\u001b[1;32m",
    blue: "\u001b[0;34m",
    lightblue: "\u001b[1;34m",
    cyan: "\u001b[0;36m",
    lightcyan: "\u001b[1;36m",
    yellow: "\u001b[0;33m",
    lightyellow:  "\u001b[1;33m",
    gray: "\u001b[0;30m",
    magenta: "\u001b[0;35m",
    lightmagenta: "\u001b[1;35m",

    lavender:  "\u001b[38;5;140m",
    lightgray: "\u001b[38;5;245m",
    brown:  "\u001b[38;5;130m",
    lightbrown:  "\u001b[38;5;203m",

    _close: "\u001b[0;39m",
};

let ApplyColor = function(nm, str)
{
    return AnsiColors[nm] +  str  + AnsiColors._close;
};

let ColorFuncs =
{
    apply: ApplyColor,
    names: AnsiColors,
};

let FileFuncs =
{
    timestampCache: {},
    touch: function(filename)
    {
        this.timestampCache[filename] = Date.now();
    },
    read: function(filename)
    {
        if(!this.exists(filename)) return null;
        return fs.readFileSync(filename, {encoding: "utf8"});
    },
    newer: function(infile, outfile)
    {
        let tsOut, tsIn;
        if(this.timestampCache[outfile] === undefined)
            this.timestampCache[outfile] = this.getTimestamp(outfile);
        tsOut = this.timestampCache[outfile];
        if(!tsOut)
        {
            // backtick - string interpolation
            jsmk.DEBUG(`newer: ${outfile} doesn't exist`);
            return true; // outfile doesn't exist...
        }

        if(this.timestampCache[infile] === undefined)
            this.timestampCache[infile] = this.getTimestamp(infile);
        tsIn = this.timestampCache[infile];
        if(!tsIn)
        {
            // backtick - string interpolation
            jsmk.DEBUG(`newer: ${infile} doesn't exist`);
            return true; // infile doesn't exist...
        }

        return tsIn > tsOut;
    },
    exists: function(fp) {
        return fs.existsSync(fp);
    },
    getTimestamp: function(fn) {
        try
        {
            let fstat = fs.statSync(fn);
            return fstat.mtime.getTime(); // milliseconds since 1970
        }
        catch (e)
        {
            switch(e.code)
            {
            case "ENOENT":
                break;
            default:
                jsmk.INFO("getTimestamp " + fn + ":" + e.code);
            }
            return null; // file doesn't exist or
        }
    },
    changeExtension: function(infile, newext)
    {
        let i = infile.lastIndexOf(".");
        if(i !== -1)
            return infile.slice(0, i+1) + newext;
        else
            return infile;
    }
};

let PathFuncs =
{
    exeExt : os.platform() === "win32" ? ".exe" : "",
    join : function() {
        return FixupPath(path.join.apply(null, arguments));
    },
    normalize: function(p) {
        return FixupPath(p);
    },
    exists: function(fp) {
        return fs.existsSync(fp);
    },
    resolveExeFile: function(basename, searchpath)
    {
        if(!Array.isArray(searchpath))
            searchpath = [searchpath];
        return this.resolveFile(basename, searchpath, true);
    },
    resolveFile: function(basename, searchpath, executable)
    {
        let exe = executable ? this.exeExt : "";
        if(PathFuncs.isAbsolute(basename))
        {
            if(this.exists(basename))
                return basename;
            if(exe != "")
            {
                let nf = basename + exe;
                if(this.exists(nf))
                    return nf;
            }
            jsmk.NOTICE(basename + " doesn't exist ("+exe+")");
            return null;
        }
        for(let sp of searchpath)
        {
            let fp = this.join(sp, basename+exe);
            if(this.exists(fp))
                return fp;
        }
        return null;
    },
    tail: function(fp)
    {
        return path.basename(fp);
    },
    basename: function(fp)
    {
        return path.basename(fp);
    },
    basenameNoExt: function(fp)
    {
        return this.stripext(path.basename(fp));
    },
    stripext: function(fp)
    {
        let i = fp.lastIndexOf(".");
        if(i !== -1)
            return fp.slice(0,i);
        else
            return fp;
    },
    isAbsolute: function(fp) {
        try
        {
            return path.isAbsolute(fp);
        }
        catch(err)
        {
            jsmk.ERROR("path.isAbsolute:  " + fp);
            throw(err);
        }
    },
    glob: function(pat) {
        return glob(pat);
    },
    issubdir: function(subdir, parentdir)
    {
        // parentdir: /c/root/lib
        // subdirA: /c/root/lib/liba (should succeed)
        // subdirB: /c/root (should fail)
        return (subdir.length >= parentdir.length) &&
            -1 != subdir.indexOf(parentdir);
    },
    makedirs: function(path)
    {
        MakeDirs(path);
    },
    rmtree: function(dir)
    {
        // for now we'll implement the sync version
        if(!fs.existsSync(dir)) return;
        let files = fs.readdirSync(dir);
        if(files.length)
        {
            for(let f of files)
            {
                let fullpath = path.join(dir, f);
                if(fs.statSync(fullpath).isDirectory())
                    PathFuncs.rmtree(fullpath);
                else
                {
                    fs.unlinkSync(fullpath);
                }
            }
        }
        // console.log("del  ", dir);
        fs.rmdirSync(dir);
    }
};

exports.Interpolate = Interpolate;
exports.FixupPath = FixupPath;
exports.MakeDirs = MakeDirs;
exports.PathFuncs = PathFuncs;
exports.FileFuncs = FileFuncs;
exports.ColorFuncs = ColorFuncs;
