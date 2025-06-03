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
        case "win32": 
            {
                // NB: there may or may not be a version of libcrypto & libssl
                // in c:/Windows/System32.  If so they were installed there
                // by a 3rd-party installer. We need to ensure that openssl
                // components are both available and the expected version.
                // On win, we have two options, ship the dll or direct-link.
                // Direct-linkable libraries are a pain to build but happily
                // there are some purveyors of such.  Here's one:
                // https://slproweb.com/products/Win32OpenSSL.html
                // NB: static libs are available in a subset of its packages.
                // NNB: static libs depend upon runtime and threading settings
                //  so there are a number of libs availabe (both VC and MING2).
                // NNNB: VC libs are probably preferred and utilize various
                //  win-native APIs.
                let eArch;
                let rootDir = "C:/Program Files (x86)/OpenSSL-WinUniversal";
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
                this.m_incDir = jsmk.path.join(rootDir, `include/${eArch}`);
                this.m_libDir = jsmk.path.join(rootDir, `lib/VC/${eArch}`);
                // libdir includes various flavors (LINKER flags!!!),
                // handled a ConfigTask below.
                //   MD:  -> link with MSVCRT (dynamic crt)
                //   MDd: -> link with MSVCRT debug
                //   MT:  -> link with LIBCMT
                //   MTd: -> LIBCMT debug.
                this.m_libs = ["libssl_static.lib", "libcrypto_static.lib"];
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
            // currently ssl operates more like syslibs and not deplibs.
            // ie: our code (deplist) depends on them like syslibs.
            console.assert(!this.m_deps || this.m_deps.length==0);
            // if(this.m_deps) task.AddDeps(this.m_deps);

            //   MD:  -> link with MSVCRT (dynamic crt)
            //   MDd: -> link with MSVCRT debug
            //   MT:  -> link with LIBCMT (static libc multithreaded)
            //   MTd: -> LIBCMT debug.
            if(Platform == "win32")
            {
                let libdir = this.m_libDir;
                let tsname = tool.GetToolset().GetName();
                if(tsname.includes("clang"))
                    libdir = jsmk.path.join(libdir, "MDd");
                else
                switch(task.BuildVars.Deployment)
                {
                case "debug":
                    libdir = jsmk.path.join(libdir, "MDd");
                    break;
                case "release":
                case "releasesym":
                    libdir = jsmk.path.join(libdir, "MD");
                    break;
                }
                let libs = this.m_libs.map((l) => jsmk.path.join(libdir, l));
                task.AddLibs(libs);
            }
            else
            {
                if(this.m_libDir)
                    task.AddSearchpaths(r, [this.m_libDir]);
                task.AddLibs(this.m_libs);
            }
            break;
        }
    }
}

exports.Framework = OpenSSL;
