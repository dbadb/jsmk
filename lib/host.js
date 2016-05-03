var os = require('os');

exports.NewHost = function()
{
    return new Host();
}

class Host
{
    constructor()
    {
        this.Name = os.hostname();
        this.Ncpus = os.cpus().length;
        this.Type = os.type();          // Linux, Darwin, Windows_NT,
        this.Platform = os.platform();  // linux, darwin, win32
        this.Arch = os.arch();          // x64, arm, ia32
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
            throw("unimplemented platform");
            break;
        case 'linux':
            // convert to marketing name?
            throw("unimplemented platform");
            break;
        default:
            this.ReleaseStr = String(this.Release);
            break;
        }
    }
}
