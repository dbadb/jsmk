var fs = require("fs");  // fs: File System
var path = require("path");
var glob = require("glob").glob.sync;

// Interpolate: uses provided map to substutes patterns like: ${VAR}
//  If a value isn't found in map, we silently leave it unsubstituted.
var Interpolate = function(str, map)
{
    return str.replace(/\$\{\w+\}/g,
            function(match)
            {
                var key = match.slice(2, -1);
                var result = map[key];
                if (result === undefined)
                    return match;
                else
                    return result;
            });
};

var FixupPath = function(str) {
    return str.replace(/\\/g, '/');
};

var MakeDirs = function(pathname, made) {
    var mode = parseInt('0777', 8) & (~process.umask());
    if (!made) made = null;

    pathname = path.resolve(pathname);

    try {
        fs.mkdirSync(pathname, mode);
        made = made || pathname;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = MakeDirs(path.dirname(pathname), made);
                MakeDirs(pathname, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.
            default:
                var stat;
                try {
                    stat = fs.statSync(pathname);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }
    return made;
};

var FileFuncs =
{
    timestampCache: {},
    newer: function(infile, outfile)
    {
        let tsOut, tsIn;
        if(this.timestampCache[outfile] === undefined)
            this.timestampCache[outfile] = this.getTimestamp(outfile);
        tsOut = this.timestampCache[outfile];
        if(!tsOut) return true; // outfile doesn't exist...

        if(this.timestampCache[infile] === undefined)
            this.timestampCache[infile] = this.getTimestamp(infile);
        tsIn = this.timestampCache[infile];
        if(!tsIn) return true; // infile doesn't exist...

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
    }
};

var PathFuncs =
{
    join : function() {
        return FixupPath(path.join.apply(null, arguments));
    },
    normalize: function(p) {
        return FixupPath(p);
    },
    exists: function(fp) {
        return fs.existsSync(fp);
    },
    basename: function(fp) {
        return path.basename(fp);
    },
    isAbsolute: function(fp) {
        return path.isAbsolute(fp);
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
            -1 != parentdir.indexOf(subdir);
    },
};

exports.Interpolate = Interpolate;
exports.FixupPath = FixupPath;
exports.MakeDirs = MakeDirs;
exports.PathFuncs = PathFuncs;
exports.FileFuncs = FileFuncs;
