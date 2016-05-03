var fs = require("fs");  // fs: File System
var path = require("path");

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
                {
                    return match;
                }
                else
                {
                    return result;
                }
            });
}

var FixupPath = function(str) {
    return str.replace(/\\/g, '/');
}

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
}


exports.Interpolate = Interpolate;
exports.FixupPath = FixupPath;
exports.MakeDirs = MakeDirs;

