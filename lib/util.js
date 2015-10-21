

// Interpolate: uses provided map to substutes patterns like: ${VAR}
//  If a value isn't found in map, we silently leave it unsubstituted.
exports.Interpolate = function(str, map)
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

exports.FixupPath = function(str) {
    return str.replace(/\\/g, "/");
}
