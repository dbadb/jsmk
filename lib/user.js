var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('./util.js');

var s_configDir = "_Config.jsmk";

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
        this.ConfigDirs = [];
        let userConfigDir = util.FixupPath(this.PrefsDir, s_configDir)
        if (fs.existsSync(userConfigDir))
            this.ConfigDirs.push(userConfigDir);
        let sharedConfigDir = process.env.JSMK_CONFIG_DIR;
        if(!sharedConfigDir)
        {
            // here we assume that the 'factory' config dir is located
            // about this (lib/) directory...
            let cdir = path.resolve(__dirname, "../" + s_configDir);
            sharedConfigDir = util.FixupPath(cdir);
        }
        if (fs.existsSync(sharedConfigDir))
            this.ConfigDirs.push(sharedConfigDir);
        else
            throw("Missing or invalid JSMK_CONFIG_DIR");
    }
}
