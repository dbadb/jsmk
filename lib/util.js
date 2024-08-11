/* global jsmk */
let fs = require("fs"); // fs: File System
let path = require("path");
let glob = require("glob").glob.sync; // === glob.globSync
let os = require("os");
let rimraf = require("rimraf");

// Interpolate: uses provided val to substitute patterns like: ${VAR}
// val can either be a map, or a function. If a value isn't found, 
// we silently leave it unsubstituted.
function Interpolate(str, val = process.env)
{
    if(typeof val === "object")
    {
        return str.replace(/\$\{\w+\}/g,
            function(match)
            {
                let key = match.slice(2, -1);
                let result = val[key];
                if(result === undefined)
                    return match;
                else
                    return result;
            });
    }
    else // presume it's a function
    if(val)
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
}

//
// tl;dr: Paths in config files should be stored in natural rep for 
//  build platform tools. ProjectDirectory trees are stored in 
//  node-natural rep. We need different reps for different uses.
// 
let NormalizeForNode = null;
let NormalizeForPlatform = null;
let BuildPlatform = os.platform(); // initial guesses
let TargetPlatform = os.platform();
let PlatformExe = "";

// UpdatePlatform is called after partial bootstrap has occurred.
function UpdatePlatform(buildPlatform, targetPlatform)
{
    BuildPlatform = buildPlatform;
    TargetPlatform = targetPlatform;
    if(BuildPlatform == "win32")
    {
        PlatformExe = ".exe";
        NormalizeForPlatform = ConvertToWin32;
    }
    else
    if(BuildPlatform == "wsl")
    {
        PlatformExe = ".exe";
        NormalizeForNode = ConvertFromWin32;
        NormalizeForPlatform = ConvertToWin32;
    }
}

function FixupPath(str)
{
    // more complex path fixups are responsibilty of normalizeArgv
    if(Array.isArray(str))
        return FixupPaths(str);
    else
        return str.replace(/\\/g, "/");
}

function FixupPaths(plist)
{
    // more complex path fixups are responsibilty of normalizeArgv
    if(typeof(plist) == "string")
        return plist.replace(/\\/g, "/");
    else
        return plist.map((p) => p.replace(/\\/g, "/"));
}

// MakeDirs: used to create output directories for logs and output files.
//  todo: don't export this symbol directly (only via PathFuncs).
function MakeDirs(pathname, made)
{
    if(NormalizeForNode)
        pathname = NormalizeForNode(pathname);
    // console.log("MakeDirs: " + pathname + "!!!!!!!!!!!!!!!!!!!!!");
    let mode = parseInt("0777", 8) & (~process.umask());
    if(!made) made = null;

    pathname = path.resolve(pathname);

    try
    {
        fs.mkdirSync(pathname, mode);
        made = made || pathname;
    }
    catch (err0)
    {
        switch (err0.code)
        {
            case "ENOENT":
                made = MakeDirs(path.dirname(pathname), made);
                MakeDirs(pathname, made);
                break;

            default:
                // In the case of any other error, just see if there's a dir
                // there already.
                try
                {
                    let stat = fs.statSync(pathname);
                    if(!stat.isDirectory())
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
}

// http://misc.flogisoft.com/bash/tip_colors_and_formatting
// for rgb colors with black bg
//  [38;5;$c then [0m where c:[0--15 are primaries, then 16-231, then gray]
let AnsiColors = // foreground only
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
        lightyellow: "\u001b[1;33m",
        gray: "\u001b[0;30m",
        magenta: "\u001b[0;35m",
        lightmagenta: "\u001b[1;35m",

        lavender: "\u001b[38;5;140m",
        lightgray: "\u001b[38;5;245m",
        brown: "\u001b[38;5;130m",
        lightbrown: "\u001b[38;5;203m",

        _close: "\u001b[0;39m",
    };

let ApplyColor = function(nm, str)
{
    return AnsiColors[nm] + str + AnsiColors._close;
};

let ColorFuncs = {
    apply: ApplyColor,
    names: AnsiColors,
};

let FileFuncs = 
{
    timestampCache: {},
    isdirCache: {},
    touch: function(filename)
    {
        this.timestampCache[filename] = Date.now();
    },
    read: function(filename)
    {
        if(!this.exists(filename)) return null;
        return fs.readFileSync(filename, { encoding: "utf8" });
    },
    write: function(filename, str, callback)
    {
        fs.writeFile(filename, str, callback);
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
            jsmk.TRACE(`newer: ${outfile} doesn't exist`);
            return true; // outfile doesn't exist...
        }

        if(this.timestampCache[infile] === undefined)
            this.timestampCache[infile] = this.getTimestamp(infile);
        tsIn = this.timestampCache[infile];
        if(!tsIn)
        {
            // backtick - string interpolation
            jsmk.TRACE(`newer: ${infile} doesn't exist`);
            return true; // infile doesn't exist...
        }

        return tsIn > tsOut;
    },
    isDir: function(fp)
    {
        let isdir = this.isdirCache[fp];
        if(isdir === undefined)
        {
            try
            {
                let fstat = fs.statSync(fp);
                isdir = fstat.isDirectory();
            }
            catch (err)
            {
                isdir = false;
            }
            this.isdirCache[fp] = isdir;
        }
        return isdir;
    },
    exists: function(fp)
    {
        if(NormalizeForNode)
            fp = NormalizeForNode(fp);
        return fs.existsSync(fp);
    },
    existsSync: function(fp)
    {
        if(NormalizeForNode)
            fp = NormalizeForNode(fp);
        return fs.existsSync(fp);
    },
    getTimestamp: function(fn)
    {
        try
        {
            if(NormalizeForNode)
                fn = NormalizeForNode(fn);
            let fstat = fs.statSync(fn);
            if(fstat.isDirectory())
                this.isdirCache[fn] = true;
            return fstat.mtime.getTime(); // milliseconds since 1970
        }
        catch (e)
        {
            switch (e.code)
            {
                case "ENOENT":
                    break;
                default:
                    jsmk.WARNING("getTimestamp error:" + fn + " " + e);
            }
            return null; // file doesn't exist or
        }
    },
    changeExtension: function(infile, newext)
    {
        let i = infile.lastIndexOf(".");
        if(i !== -1)
            return infile.slice(0, i + 1) + newext;
        else
            return infile;
    },
    rmtree: function(dir)
    {
        rimraf.sync(dir);
        return;

        // for now we'll implement the sync version
        if(NormalizeForNode)
            dir = NormalizeForNode(dir);
        if(!fs.existsSync(dir)) return;
        let files = fs.readdirSync(dir);
        if(files.length)
        {
            for(let f of files)
            {
                let fullpath = path.join(dir, f);
                if(!fs.existsSync(fullpath))
                {
                    console.error(`huh?: ${fullpath}`);
                    continue;
                }
                if(fs.statSync(fullpath).isDirectory())
                {
                    try
                    {
                        FileFuncs.rmtree(fullpath); // recur
                    }
                    catch(err)
                    {
                        console.error(`hrrm: ${err} for ` + fullpath);
                    }
                }
                else
                {
                    try
                    {
                        fs.unlinkSync(fullpath);
                    }
                    catch(err)
                    {
                        console.error(`hrrm2: ${err} for ` + fullpath);
                    }
                }
            }
        }
        // console.log("del  ", dir);
        fs.rmdirSync(dir);
    },
    rmfile: function(file)
    {
        if(NormalizeForNode)
            file = NormalizeForNode(file);
        if(!fs.existsSync(file)) 
        {
            // console.log("rmfile missing  ", file); // a normal condition
            return;
        }
        // console.log("del  ", file);
        fs.unlinkSync(file);
    }
};

let PathFuncs = 
{
    join: function()
    {
        // join of c:/tmp, bar -> c:/tmp/bar works on "linux"
        let np = path.join.apply(null, arguments);
        let nnp = FixupPath(np);
        return nnp;
    },
    normalize: function(p)
    {
        // FixupPath only normalizes slashes, doesn't enforce
        //  c:/ vs /mnt/c, more notes at top.
        return FixupPath(p);
    },
    normalizeEnv: function(map)
    {
        if(NormalizeForPlatform && 0)
        {
            for(let key in map)
            {
                map[key] = NormalizeForPlatform(map[key]);
            }
        }
    },
    normalizeArgv: function(arglist, cwd)
    {
        // search for filepaths in arglist, convert all to
        // platform representation, optionally relativize to cwd
        if(NormalizeForPlatform)
        {
            for(let i in arglist)
            {
                if(i == 0)
                {
                    if(NormalizeForNode)
                        arglist[0] = NormalizeForNode(arglist[0]);
                }
                else
                    arglist[i] = NormalizeForPlatform(arglist[i], cwd);
            }
        }
    },
    exists: function(fp)
    {
        return FileFuncs.exists(fp);
    },
    existsSync: function(fp)
    {
        return FileFuncs.existsSync(fp);
    },
    resolveExeFile: function(basename, searchpath)
    {
        if(!Array.isArray(searchpath))
            searchpath = [searchpath];
        return this.resolveFile(basename, searchpath, true);
    },
    resolveFile: function(basename, searchpath, executable)
    {
        let exe = executable ? PlatformExe : "";
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
            return null;
        }
        for(let sp of searchpath)
        {
            if(!sp) continue;
            let fp = this.join(sp, basename + exe);
            if(this.exists(fp))
                return fp;
        }
        return null;
    },
    tail: function(fp)
    {
        return path.basename(fp);
    },
    dirname: function(p)
    {
        return path.dirname(p);
    },
    basename: function(fp)
    {
        return path.basename(fp);
    },
    basenameNoExt: function(fp, lastOnly = true)
    {
        return this.stripext(path.basename(fp), lastOnly);
    },
    stripext: function(fp, lastOnly = true)
    {
        if(!fp) return "";
        if(lastOnly)
        {
            // legacy handles most cases where extension is present
            let i = fp.lastIndexOf(".");
            if(i !== -1)
                return fp.slice(0, i);
            else
                return fp;
        }
        else
        {
            // need to handle cases where directories have .
            let fpp = path.parse(fp);
            let i = fpp.base.indexOf(".");
            if(i != -1)
            {
                fpp.ext = "";
                fpp.name = "";
                fpp.base = fpp.base.slice(0, i);
                return path.format(fpp);
            }
            else
                return fp;
        }
    },
    isAbsolute: function(fp)
    {
        // jsmk.NOTICE(`path.isAbsolute: ${fp} isarray:` + Array.isArray(fp));
        try
        {
            if(NormalizeForNode)
                fp = NormalizeForNode(fp);
            return path.isAbsolute(fp);
        }
        catch (err)
        {
            jsmk.ERROR("path.isAbsolute:  " + fp);
            throw (err);
        }
    },
    parse: function(pathname)
    {
        return path.parse(pathname);
    },
    format: function(pathobj)
    {
        return path.format(pathobj);
    },
    relative: function(projdir, pathname)
    {
        let np = path.relative(projdir, pathname);
        if(np == "")
            return ".";
        else
            return FixupPath(np);
    },
    glob: function(pat)
    {
        if(NormalizeForNode && this.isAbsolute(pat))
            pat = NormalizeForNode(pat);
        return FixupPaths(glob(pat));
    },
    getsubdirs: function(dir)
    {
        if(NormalizeForNode)
            dir = NormalizeForNode(dir);
        const isDirectory = function(file)
        {
            return fs.lstatSync(file).isDirectory();
        };
        const getSubDirs = function(dir)
        {
            // no NormalizeForNode here.
            return fs.readdirSync(dir)
                .map(function(file)
                {
                    //return FixupPath(path.join(dir, file));
                    return file;
                })
                .filter(isDirectory);
        };
        return getSubDirs(dir);
    },
    issubdir: function(subdir, parentdir)
    {
        // parentdir: /c/root/lib
        // subdirA: /c/root/lib/liba (should succeed)
        // subdirB: /c/root (should fail)
        if(NormalizeForNode)
            subdir = NormalizeForNode(subdir);
        return (subdir.length >= parentdir.length) &&
            -1 != subdir.indexOf(parentdir);
    },
    makedirs: function(path)
    {
        if(NormalizeForNode)
            path = NormalizeForNode(path);
        MakeDirs(path);
    },
    rmtree: function(dir)
    {
        // for now we'll implement the sync version
        if(NormalizeForNode)
            dir = NormalizeForNode(dir);
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

let toW1 = /\/mnt\/[a-zA-Z]\/(\\w+)*/; // /mnt/d/...
let toW2 = /\/[a-zA-Z]\/(\\w+)*/; // /d/...
// these expressions don't require match at first char
// currently then match to end of str
function ConvertToWin32(str, cwd)
{
    // todo: relativize
    if(toW1.test(str))
    {
        str = str.replace(toW1, function(match)
        {
            return `${match[5].toUpperCase()}:${match.slice(6)}`;
        });
    }
    else
    if(toW2.test(str))
    {
        str = str.replace(toW2, function(match)
        {
            return `${match[1].toUpperCase()}:{$match.slice(1)}`;
        });
    }
    return str;
}

// we assume all slashes are forward
let fromW1 = /^[a-zA-Z]:\/(\\w+)*/;

function ConvertFromWin32(str)
{
    if(fromW1.test(str))
        str = "/mnt/" + str[0].toLowerCase() + str.slice(2);
    return str;
}

/*----------------------------------------------------------------------*/
exports.Interpolate = Interpolate;
exports.FixupPath = FixupPath;
exports.FixupPaths = FixupPaths;
exports.PathFuncs = PathFuncs;
exports.FileFuncs = FileFuncs;
exports.ColorFuncs = ColorFuncs;
exports.UpdatePlatform = UpdatePlatform;
exports.PlatformExe = PlatformExe;
