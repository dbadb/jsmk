var os = require('os');

class Host
{
    constructor()
    {
        // hostname fields are directly populated into BuildVars
        // prepended with Host, ie: HostName, HostNcpus, HostPlatform
        this.Name = os.hostname();
        this.Ncpus = os.cpus().length;
        this.Type = os.type();          // Linux, Darwin, Windows_NT,
        this.Platform = os.platform();  // linux, darwin, win32
        this.TargetPlatform = os.platform();// default
        this.Arch = os.arch();          // x64, arm, arm64, ia32
        this.TargetArch = os.arch();    // default
        this.Release = os.release();    // 10.0.10240
        this.ReleaseFields = this.Release.split('.'); // an array

        // compute canonical relstr... this is intended to capture
        // the broad dependencies associated with the os.
        switch(this.Platform)
        {
        case 'win32':
            // just take the first field of 10.0.1024
            this.ReleaseStr = this.ReleaseFields.slice(0,2).join('.');
            break;
        case 'darwin':
            // convert to marketing name?
            throw new Error("unimplemented platform");
            break;
        case 'linux':
            // convert to marketing name?
            //  debian stretch: 4.4.91-ti-r133
            this.ReleaseStr = this.ReleaseFields.slice(0,2).join('.');
            if(this.Release.indexOf("Microsoft") != -1)
            {
                // override os.platform so we can distinguish
                // linux from wsl..
                os.platform = function()
                {
                    return "wsl"; // windows subsystem for linux
                };
                this.Platform = os.platform();
                this.TargetPlatform = "win32";
            }
            break;
        default:
            this.ReleaseStr = String(this.Release);
            break;
        }
    }

    GetToolsets()
    {

    }
}

exports.Host = Host;
