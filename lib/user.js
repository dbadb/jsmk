var os = require('os');
var path = require('path');
var util = require('./util.js');
var process = require('process');

exports.NewUser = function()
{
    return new User();
}

class User
{
    constructor()
    {
        this.Name = path.basename(os.homedir()); // hrmm...
        this.PrefsDir = util.FixupPath(path.join(os.homedir(), ".jsmk"));
        this.LogDir = util.FixupPath(path.join(this.PrefsDir, "logs"));
        this.ConfigDir = process.env.JSMK_CONFIG_DIR;
        if(!this.ConfigDir) {
            throw("Mising or invalid JSMK_CONFIG_DIR");
            // XXX: we can infer from fully qualified argv
            // or infer our location from path.resolve (with path)
        }
    }
    
}
