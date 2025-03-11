//
// A Framework for openssl's c library
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;
let Platform = jsmk.GetHost().Platform;
let FrameworkDirs = jsmk.GetPolicy().LocalFrameworkDirs;

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
        // NB: windows now ships with openssl libs in /Windows//System32
        case "win32": 
            {
                let eArch;
                switch(this.m_arch)
                {
                case "x64":
                case Toolset.Arch.x86_64:
                    eArch = "x64";
                    break;
                case "x86":
                case Toolset.Arch.x86_32:
                    eArch = "x86";
                    break;
                default:
                    throw new Error("OpenSSL unsuppported arch " + 
                                    this.m_arch + "(" + Toolset.Arch.x86_64 + ")");
                }
                for(let fw of FrameworkDirs)
                {
                    let incdir = jsmk.path.join(fw, `openssl/openssl-3/${eArch}/include`);
                    let libdir = jsmk.path.join(fw,`openssl/openssl-3/${eArch}/lib`);
                    if(jsmk.path.existsSync(incdir))
                    {
                        this.m_incDir = incdir;
                        this.m_libDir = libdir;
                        break;
                    }
                }
                if(this.m_toolset.Name.startsWith("clang"))
                {
                    // hrm, -L doesn't work on window + clang?
                    // this.m_libs = ["-lssl", "-lcrypto"];
                    this.m_libs = [
                            `${this.m_libDir}/libssl.lib`,
                            `${this.m_libDir}/libcrypto.lib`
                        ];
                }
                else
                    this.m_libs = ["libssl.lib", "libcrypto.lib"];
            }
            break;
        case "darwin":
            {
                // /opt/homebrew/openssl@3/3.0.5/lib (files are single-arch)
                // /opt/homebrew/include
                // let subdir = "openssl@3/3.0.5";
                this.m_incDir = "/opt/homebrew/include";
                this.m_libDir = "/opt/homebrew/lib";
                // prefer static linking for simpler code-signing, etc.
                this.m_libs = [
                    `${this.m_libDir}/libssl.a`,
                    `${this.m_libDir}/libcrypto.a`
                ];
            }
            break;
        case "linux":
            this.m_libs = ["-lssl", "-lcrypto"];
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
            if(this.m_incDir)
                task.AddSearchpaths(r, [this.m_incDir]);
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            if(this.m_libDir)
                task.AddSearchpaths(r, [this.m_libDir]);
            // currently ssl operates more like syslibs and not deplibs.
            // ie: our code (deplist) depend on them like syslibs.
            console.assert(!this.m_deps || this.m_deps.length==0);
            if(this.m_deps)
                task.AddDeps(this.m_deps);
            if(this.m_libs)
                task.AddLibs(this.m_libs);
            break;
        }
    }
}

exports.Framework = OpenSSL;
