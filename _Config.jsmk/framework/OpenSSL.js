//
// A Framework for openssl's c library
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;
let Platform = jsmk.GetHost().Platform;
let FrameworkDir = jsmk.GetPolicy().LocalFrameworkDir;

// windows: https://kb.firedaemon.com/support/solutions/articles/4000121705-openssl-3-0-and-1-1-1-binary-distributions-for-microsoft-windows

class OpenSSL extends Framework
{
    // user's Project requests access to a framework by
    // name and version.  OpenSSL's versioning is approximately 
    // semantic, ie: 1.1.1 and 3.0.7 are the current versions.
    // We expect users to request a version based on the first
    // two fields.
    constructor(name, version)
    {
        super(name, version);
        if(!version.match(/^(3.0|default)/))
            throw new Error(`OpenSSL unsupported version: ${version} (3.0 required)`);

        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        switch(Platform)
        {
        case "win32":
            {
                let eArch;
                switch(this.m_arch)
                {
                case Toolset.Arch.x86_64:
                    eArch = "x64";
                    break;
                case Toolset.Arch.x86_32:
                    eArch = "x86";
                    break;
                default:
                    throw new Error("OpenSSL unsuppported arch " + this.m_arch);
                }
                this.m_incDir = jsmk.path.join(FrameworkDir, `openssl/openssl-3/${eArch}/include`);
                this.m_libDir = jsmk.path.join(FrameworkDir,`openssl/openssl-3/${eArch}/lib`);
                this.m_libs = ["libssl.lib", "libcrypto.lib"];
            }
            break;
        case "darwin":
            {
                // /opt/homebrew/openssl@3/3.0.5/lib (files are single-arch)
                let subdir = "openssl@3/3.0.5";
                this.m_incDir = jsmk.path.join(FrameworkDir, `${subdir}/include`);
                this.m_libDir = jsmk.path.join(FrameworkDir,`${subdir}/lib`);
                // this.m_libs = ["libssl.a", "libcrypto.a"];
                this.m_libs = ["-lssl", "-lcrypto"];
            }
            break;
        default:
            throw new Error("OpenSSL implemented platform " + Platform);
        }
    }

    ConfigureTaskSettings(task) /* the preferred mode of operation */
    {
        let tool = task.GetTool();
        let r = tool.GetRole();
        switch(r)
        {
        case Tool.Role.Compile:
            task.AddSearchpaths(r, [this.m_incDir]);
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            task.AddSearchpaths(r, [this.m_libDir]);
            task.AddLibs(this.m_libs);
            break;
        }
    }
}

exports.Framework = OpenSSL;