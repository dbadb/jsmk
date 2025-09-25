//
// A Framework for CEF - Chromium Embedded Framework.
//
// assumes: 
//  - binary release-mode distribution downloaded from eg: 
//         https://cef-builds.spotifycdn.com/index.html
//    and placed below ${PROJ}/_frameworks/CEF/${ARCH}/${CEFVERS}/...
//    eg: _frameworks/CEF/x86_64-win32/139/...  (NB: distributes are large so can't
//         be checked in).
//  - Project is extended to include compilation of C++ dll-bridge components
//    via jsmk.GetFramework("CEF", vers?).ConfigureProject(Project, "compileC++Binding");
//  - Project can resolve relative paths below itself (and into _frameworks/...)
//    
// issues:
//  - on macos we must produce a collection of apps (to support secure subprocesses?)
//    For Spotiy.spp/Frameworks: 
//          Chromium Embedded Framework.framework/ 
//          Spotify Helper (Renderer).app/
//          Spotify Helper (GPU).app/              
//          Spotify Helper.app/
//          Spotify Helper (Plugin).app/
//   and eg, refs to cross-app dylibs are relative:
//      ../../../Chromium Embedded Framework.framework/Libraries/libcef_sandbox.dylib
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Platform = jsmk.GetHost().Platform;
let FrameworkDirs = jsmk.GetPolicy().LocalFrameworkDirs;

// const sDefaultCEFVers = "139"; // 9/1/25
// NB: windows needs work to support 140 (?app needs to request permissions?)
//  https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/design/sandbox.md#lpac-file-system-permissions
const sDefaultCEFVers = Platform == "win32" ? "139" : "140"; // 9/22/25
const sDefaultConfigProj = "compileDLLBinding";

class CEF extends Framework
{
    // user's Project requests access to a framework by name and version.  
    constructor(name, version)
    {
        super(name, version);
        if(version == "default")
            this.m_version = sDefaultCEFVers;

        const ts = jsmk.GetActiveToolset();
        const arch = ts.TargetArch;
        const plt = Platform;
        const key = `${arch}-${plt}`;
        const fwdir = `CEF/${key}/${this.GetVersion()}`; // root-relative
        for(let fw of FrameworkDirs)
        {
            // CEF's own files refer to themselfs via "include/"
            // so we follow suit and point to its parent.
            let fwpath = jsmk.path.join(fw, fwdir); 
            if(jsmk.path.existsSync(fwpath))
            {
                this.m_fwpath = fwpath;
                this.m_incdir = fwpath;
                break;
            }
        }
        if(!this.m_fwpath)
        {
            jsmk.ERROR(`${fwdir} can't be found`);
            throw new Error("CEF framework botch");
        }
    }

    ConfigureProject(proj, how=sDefaultConfigProj, cfg) // CEF-specific
    {
        if(typeof(how) == "string") how = [how];

        const ts = jsmk.GetActiveToolset();
        const tsname = ts.Name;
        const arch = ts.TargetArch;
        const plt = jsmk.GetHost().Platform;
        const key = `${arch}-${plt}`;

        let cefProjState = {};
        cefProjState.runtimeComponents = {
            bin: [],
            resources: [],
        };
        proj.SetBuildVar("CEFProjState", cefProjState);
        proj.SetBuildVar("DefaultManifest", false);
        cefProjState.arch = arch;
        cefProjState.plt = plt;
        cefProjState.key = key;
        cefProjState.deploy = proj.GetBuildVar("Deployment");
        cefProjState.fwdir = this.m_fwpath;
        cefProjState.incdirs = [this.m_incdir];
        cefProjState.ccdefs = {
            CEF_USE_BOOTSTRAP: null,
            WRAPPING_CEF_SHARED: 1,
            __STDC_CONSTANT_MACROS:null, // support for eg: UINT8_MAX, etc
            __STDC_FORMAT_MACROS:null,
        };
        cefProjState.ccflags = [];
        cefProjState.lnkflags = [] 
        cefProjState.installRoot = proj.EvaluateBuildVar("InstallDir");
        if(!cfg.installInfo)
            throw new Error("CEF requires InstallInfo from embedding proj.");
        else
            cefProjState.installInfo = cfg.installInfo;

        const debug = cefProjState.deploy == "debug";
        let cppStd = proj.GetBuildVar("CppStd"); // c++17, c++20, c++23
        if(!cppStd || parseInt(cppStd.slice(3)) < 17)
        {
            jsmk.NOTICE("CEF overriding CppStd to c++17");
            proj.SetBuildVar("CppStd", "c++17");
        }
        cefProjState.syslibs = [];
        // currently copyfile doesn't support searchpaths and since
        // installs occur relative to a subproject, we either need a relative
        // ref or fully qualified.
        const projdir = proj.ProjectDir;
        const rtbindir = jsmk.path.join(this.m_fwpath, (debug?"Debug":"Release")); 
        switch(plt)
        {
        case "win32":
            proj.SetBuildVar("Win32Console","static"); // CEF's preferred mode.
            const rtrezdir = jsmk.path.join(this.m_fwpath, "Resources"); 
            cefProjState.ccdefs = Object.assign(cefProjState.ccdefs, {
                CEF_USE_ATL: null,
                NOMINMAX: null,
                WINVER: "0x0A00",
                _WIN32_WINNT: "0x0A00",
                NTDDI_VERSION: "NTDDI_WIN10_FE",
                WIN32_LEAN_AND_MEAN: null,
                _HAS_EXCEPTIONS: 0,
                UNICODE: null,
                _UNICODE: null,
                _CRT_SECURE_NO_WARNINGS: null, // fopen (also covered by vc's wd4996)
            });
            // By default, CEF assumes all resources are in the same directory 
            // as the EXE (or libcef.dll).  At startup, you can override this 
            // with fields in cef_settings_t:
            //      resources_dir_path → where .pak files are located.
            //      locales_dir_path → where locales\ lives.
            cefProjState.libcef = jsmk.path.join(rtbindir,  "libcef.lib");
            cefProjState.runtimeComponents.build = [
                jsmk.path.join(projdir, "build/win32/example.manifest"), // rename-me!
            ]
            cefProjState.runtimeComponents.bin = [
                    // jsmk.path.join(rtbindir, "bootstrap.exe"), // rename-me!
                    // -or- jsmk.path.join(pdir,  "bootstrapc.exe"), // rename-me!
                jsmk.path.join(rtbindir, "chrome_elf.dll"),
                jsmk.path.join(rtbindir, "d3dcompiler_47.dll"),
                jsmk.path.join(rtbindir, "dxcompiler.dll"),
                jsmk.path.join(rtbindir, "dxil.dll"),
                jsmk.path.join(rtbindir, "libcef.dll"),
                jsmk.path.join(rtbindir, "libEGL.dll"),
                jsmk.path.join(rtbindir, "libGLESv2.dll"),
                jsmk.path.join(rtbindir, "v8_context_snapshot.bin"),
                jsmk.path.join(rtbindir, "vk_swiftshader.dll"),
                jsmk.path.join(rtbindir, "vk_swiftshader_icd.json"),
                jsmk.path.join(rtbindir, "vulkan-1.dll"),
                jsmk.path.join(rtrezdir, "chrome_100_percent.pak"),
                jsmk.path.join(rtrezdir, "chrome_200_percent.pak"),
                jsmk.path.join(rtrezdir, "icudtl.dat"),
                jsmk.path.join(rtrezdir, "locales"), // directory
                jsmk.path.join(rtrezdir, "resources.pak"),
            ];
            if(tsname == "clang")
                this.appendWin32ClangFlags(cefProjState, debug);
            else
                this.appendMSVFlags(cefProjState, debug);
            break;
        case "darwin":
            {
                const ceffw = jsmk.path.join(rtbindir, "Chromium Embedded Framework.framework");
                cefProjState.runtimeComponents.framework = [ ceffw ];

                // const libdir = jsmk.path.join(rtbindir, "Libraries");
                // const rezdir = jsmk.path.join(fwdir, "Resources"); 
                cefProjState.frameworks = ["AppKit", "CoreServices", 
                                            "CoreFoundation"]
                this.appendDarwinClangFlags(cefProjState, debug);
            }
            break;
        case "linux":
            break;
        }

        this.addBindingToProj(cefProjState, proj); // not negotiable
        for(let h of how)
        {
            switch(h)
            {
            case sDefaultConfigProj: // already done
                break;
            case "buildSimpleClient":
                this.addSimpleClientToProj(cefProjState, proj);
                break;
            case "buildTestClient":
                this.addTestClientToProj(cefProjState, proj);
                break;
            default:
                throw Error(`CEF can't config project ${h}`);
            }
        }
    }

    CreateSubprojApp(proj, appName, projDir, cfg) // CEF-specific
    {
        const self = this;
        const cefProjState = proj.GetBuildVar("CEFProjState");
        if(cefProjState == null)
            throw new Error("CEF can't configure a subproject on an unconfigured root proj");
        return proj.NewProject(appName, {
            ProjectDir:  projDir,
            init: function(subProj)
            {
                subProj.SetBuildVar("AppName", appName);

                let instInfo = cfg.installInfo || cefProjState.installInfo;
                if(instInfo.Package)
                {
                    // this must precede module creation?
                    subProj.SetBuildVar("Package", instInfo.Package)
                    subProj.SetBuildVar("InstallDir", subProj.EvaluateBuildVar("InstallDirTmplt"));
                    // jsmk.WARNING("subproj installdir " + subProj.EvaluateBuildVar("InstallDir"));
                    if(instInfo.AppName && appName != instInfo.AppName)
                        jsmk.DEBUG(`${appName} overrides Package appName ${instInfo.AppName}`);
                }
                let m = subProj.NewModule(`${appName}_mod`);
                let {cppinputs, mminputs, rcinputs, libs} = cfg;
                if(cppinputs && cppinputs.length)
                    cppinputs = cppinputs.flatMap((v) => subProj.Glob(v));
                if(mminputs && mminputs.length)
                    mminputs = mminputs.flatMap((v) => subProj.Glob(v));
                if(rcinputs && rcinputs.length)
                    rcinputs = rcinputs.flatMap((v) => subProj.Glob(v));
                if(libs == null) libs = [];

                const tcomp = m.NewTask("compile", "cpp->o", {
                    inputs: cppinputs,
                    define: {
                        APP_NAME: appName
                    },
                });
                let compileOuts = tcomp.GetOutputs().slice(); // clone
                if(mminputs && mminputs.length)
                {
                    const mmcomp = m.NewTask("mmcomp", "mm->o", {
                        inputs: mminputs,
                        define: {
                            APP_NAME: appName
                        },
                    });
                    compileOuts.push(...mmcomp.GetOutputs());
                }
                if(rcinputs && rcinputs.length)
                {
                    const rccomp = m.NewTask("rccomp", "rc->o", {
                        inputs: rcinputs,
                    });
                    compileOuts.push(...rccomp.GetOutputs());
                }

                // win32 notes:
                //  - create a dll that is loaded by bootstrap.exe
                //  - wrt static-vs-dynamic is controlled by -MT vs -MD flags 
                //   at compile-time. AI says static is generally preferred
                //   to simplify distribution (but enlarge the distro).
                // 
                let rule = (Platform == "win32") ? "cpp.o->so" : "cpp.o->exe";
                const tlink = m.NewTask(appName, rule, 
                    {
                        inputs: [...compileOuts],
                        // add link flags, etc.
                        deps: [],
                        libs,
                        frameworks: [],
                        flags: [],
                    });
                m.NewTask(`install${appName}`, "install", {
                    inputs: tlink.GetOutputs(),
                    installdir: instInfo.binDir
                });

                self[`extendSubprojApp_${Platform}`](appName, subProj, m, cfg, 
                                                cefProjState, instInfo,
                                                tcomp.GetOutputs(),
                                                libs
                                            );
            } // end init
        });
    }

    extendSubprojApp_win32(appName, subProj, m, cfg, cefProjState, instInfo, 
                        appObjsUnused, appLibs)
    {
        // on windows, our newly minted dll exports RunWinMain, et
        m.NewTask("installCEFRuntimeBuild", "install", {
            inputs: cefProjState.runtimeComponents.build,
            installdir: instInfo.binDir,
            renametarget: (tname) =>
            {
                if(!tname.endsWith(".manifest")) return tname;
                return tname.replace(/example/, appName);
            },
        });
        m.NewTask("installCEFRuntimeBin", "install", {
            inputs: cefProjState.runtimeComponents.bin,
            installdir: instInfo.binDir,
            renametarget: (tname) =>
            {
                if(!tname.includes("bootstrap")) return tname;
                return tname.replace(/bootstrap/, appName);
            },
        });
        m.NewTask("installCEFRuntimeRez", "install", {
            inputs: cefProjState.runtimeComponents.resources,
            installdir: instInfo.resourceDir
        });
        if(cfg.bootstrapSrc)
        {
            m.NewTask("installAppBootstrap", "install", {
                inputs: [cfg.bootstrapSrc],
                installdir: instInfo.binDir,
            });
        }
    }

    extendSubprojApp_darwin(appName, subProj, m, cfg, 
            cefProjState, instInfo, 
            appObjs, appLibs)
    {
        // build all the helpers exes
        const plistTemplate = cfg.darwin.plistTemplate;
        const plistHelperTemplate = cfg.darwin.plistHelperTemplate;
        const helperInputs = subProj.Glob(cfg.darwin.helperSrc);
        const resources = subProj.Glob(cfg.darwin.resources);
        const bundleExtMap = {};
        let helperOutputs = [];
        let plistBase = {
            EXECUTABLE_NAME: appName,
            PRODUCT_NAME: appName,
            VERSION_SHORT: instInfo.AppVers,
            BUNDLE_ID: instInfo.AppBundle,
            BUNDLE_ID_SUFFIX: "",
        };

        let t0 = m.NewTask("installAppPlist", "install", {
                inputs: [plistTemplate],
                installdir: jsmk.path.dirname(instInfo.binDir),
            });
        t0.onFilter = (str) =>
            {
                // nb: this runs later so referenced values must
                //  be 'stable'.
                return str.replace(/\$\{\w+\}/g, (match) =>
                { 
                    let key = match.slice(2, -1);
                    return plistBase[key] || match;
                });
            };
        // mac-specific resources here.-----------
        m.NewTask("installAppRez", "install", { 
            inputs: resources,
            installdir: instInfo.resourceDir
        });

        for(let h of [ " (Alerts)", " (GPU)", " (Plugin)",
                        " (Renderer)", ""])
        {
            let mnm = `${appName} Helper${h}`;

            // (Alerts) => alerts
            bundleExtMap[mnm] = h.trim()
                                .toLowerCase()
                                .replace(/[\(\)]/g, "");
            let m = subProj.NewModule(mnm+"_mod");
            let mcomp = m.NewTask("mcomp", "mm->o", {
                inputs: helperInputs,
                define: {
                    APP_NAME: appName
                },
            });

            // link phase
            let t = m.NewTask(mnm, "cpp.o->exe",
            {
                inputs: [...mcomp.GetOutputs(), ...appObjs],
                // nb: configure task (herein) does work too!
                deps: [],
                libs: appLibs,
                frameworks: [],
                flags: [],
            });
            helperOutputs.push(...t.GetOutputs());
            // need to add to install
        }
        // XXX: MacOS frameworks support versioning vs sym-links
        //   for now we can punt since our frameworks are private and
        //   packaged per-release.
        const fwDst = jsmk.path.join(instInfo.binDir, "../Frameworks");
        for(let ho of helperOutputs)
        {
            let hoBase = jsmk.path.basename(ho);
            let helperAppDir = jsmk.path.join(fwDst, 
                            `${hoBase}.app`, "Contents/MacOS");
            m.NewTask(`installExe${hoBase}`, "install", {
                inputs: [ho],
                installdir: helperAppDir
            });
            let lplist = Object.assign({}, plistBase);
            lplist.EXECUTABLE_NAME = hoBase;
            if(bundleExtMap[hoBase].length == 0)
                lplist.BUNDLE_ID_SUFFIX = ".helper";
            else
                lplist.BUNDLE_ID_SUFFIX = `.helper.${bundleExtMap[hoBase]}`;

            let t = m.NewTask(`installPlist${hoBase}`, "install", {
                inputs: [plistHelperTemplate],
                installdir: jsmk.path.dirname(helperAppDir),
            });
            t.onFilter = (str) =>
                {
                    // nb: this runs later so referred values must
                    //  be 'stable'.
                    return str.replace(/\$\{\w+\}/g, (match) =>
                    { 
                        let key = match.slice(2, -1);
                        return lplist[key] || match;
                    });
                };
        }
        m.NewTask("installCEFRuntimeFramework", "install", {
            inputs: cefProjState.runtimeComponents.framework,
            installdir: fwDst,
            renametarget: (tname) =>
            {
                return tname;
            },
        });
        m.NewTask("installCEFRuntimeRez", "install", {
            inputs: cefProjState.runtimeComponents.resources,
            installdir: instInfo.resourceDir
        });
    }

    extendSubprojApp_linux(appName, subProj, m, cfg, cefProjState, instInfo)
    {
        throw new Error("Unimplemented platform: linux");
    }

    ConfigureTaskSettings(task) // per-subtask callback: all frameworks must implement
    {
        // const fwpath = jsmk.path.join(proj.GetRootDir(), cefProjState.fwdir);
        // given; /foo/var/root/_frameworks/..., /foo/var/root/subproj/proj1
        //  =>  "../../_frameworks/..."
        const cefProjState = task.GetBuildVar("CEFProjState");

        let rootDir = task.GetRootDir(); // perhaps domain dir is more accurate?
        let projDir = task.GetProjectDir();
        let incdirs = cefProjState.incdirs;
        if(incdirs && rootDir !== projDir)
        {
            // relativize searchpaths
            // eg: path.relative(projdir, projroot+fwpath)
            //     '..\\..\\_framework\\cef\\139'
            incdirs = incdirs.map((v) =>
            {
                if(jsmk.path.isAbsolute(v)) return v;
                let sp = jsmk.path.join(rootDir, v);
                return jsmk.path.relative(projDir, sp);
            });
        }

        let tool = task.GetTool();
        let r = tool.GetRole();

        if(incdirs)
            task.AddSearchpaths(r, incdirs);

        switch(r)
        {
        case Tool.Role.Compile:
            if(task.GetRule() == "rc->o")
            {
                // don't add all the cc flags
            }
            else
            if(cefProjState.ccflags)
                task.AddFlags(r, cefProjState.ccflags);
            if(cefProjState.ccdefs)
                task.Define(cefProjState.ccdefs);
            break;
        case Tool.Role.Archive: // no link flags.
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            if(cefProjState.lnkflags)
                task.AddFlags(r, cefProjState.lnkflags);
            if(cefProjState.libs)
                task.AddLibs(cefProjState.libs);
            if(cefProjState.syslibs)
                task.AddLibs(cefProjState.syslibs);
            if(cefProjState.frameworks)
                task.AddFrameworks(cefProjState.frameworks);
            break;
        }
    }

    /* ------------------------------------------------------------------- */
    appendMSVFlags(cefProjState, debug)
    {
        let {ccflags} = cefProjState;
        if(debug)
        {
            ccflags.push(
                "-RTC1", // disable optimizations
                "-Od",
                "-Ob0"
            );
        }
        else
        {
            ccflags.push(
                "-O2", // max speeed
                "-Ob2", // inline
                "-GF", // string pooling
            );
        }
        ccflags.push(
            "-Zi",
            "-MP", // multiprocess, not needed since we parallelize
            "-Gy",  // function-level linking
            "-GR-", // disable RTTI
            "-W4", // warning level
            "-WX", // warnings are errors
            "-Gm-", 
            "-GS", 
            "-fp:precise", 
            "-Zc:wchar_t", 
            "-Zc:forScope", 
            "-Zc:inline", 
            "-wd4100", // Ignore "unreferenced formal parameter" warning
            "-wd4127", // Ignore "conditional expression is constant" warning
            "-wd4244", // Ignore "conversion possible loss of data" warning
            "-wd4324", // Ignore "structure was padded due to alignment specifier" warning
            "-wd4481", // Ignore "nonstandard extension used: override" warning
            "-wd4512", // Ignore "assignment operator could not be generated" warning
            "-wd4701", // Ignore "potentially uninitialized local variable" warning
            "-wd4702", // Ignore "unreachable code" warning
            "-wd4996", // Ignore "function or variable may be unsafe" warning (CRT_SECURE...)
        );
        this.appendWin32LinkFlags(cefProjState, debug, true);
    }

    appendWin32ClangFlags(cefProjState, debug)
    {
        let {ccflags} = cefProjState;
        if(debug)
            ccflags.push("-g"); // could add "-O0"?
        else
            ccflags.push("-O3");
        ccflags.push(
            "-fno-strict-aliasing", // assumptions regarding non-aliasing of objects of different types
            "-fstack-protector", // some vulnerable functions from stack-smashing (security feature)
            "-funwind-tables", // stack unwinding for backtrace()
            "-fvisibility=hidden", // hidden visibility to declarations that are not explicitly marked as visible
            "-Wall", // all warnings
            "-Werror", // warnings as errors
            "-Wextra", // additional warnings
            "-Wendif-labels", // whenever an #else or an #endif is followed by text
            "-Wnewline-eof", // about no newline at end of file
            "-Wno-missing-field-initializers", // warn about missing field initializers
            "-Wno-unused-parameter", // warn about unused parameters
            "-fno-threadsafe-statics", //  Don't generate thread-safe statics
            "-fobjc-call-cxx-cdtors", //  Call the constructor/destructor of C++ instance variables in ObjC objects
            "-fvisibility-inlines-hidden", //  Give hidden visibility to inlined class member functions
            "-Wno-narrowing", //  Don't warn about type narrowing
            "-Wsign-compare", //  Warn about mixed signed/unsigned type comparisons
            "-Wno-undefined-var-template", // Don't warn about potentially uninstantiated static members
        );
        if(cefProjState.plt == "win32")
            ccflags.push("-Wno-cast-function-type"); // cef_util_win.cc
        this.appendWin32LinkFlags(cefProjState, debug, false/*=> no delayload*/);
        cefProjState.syslibs = cefProjState.syslibs.map((l) => `-l${l}`);
    }

    appendWin32LinkFlags(cefProjState, debug, delayLoad)
    {
        let lnkflags = cefProjState.lnkflags;
        cefProjState.syslibs = [
           "atls.lib", // static crt, dynamic is "atl.lib"
           "comctl32.lib", "crypt32.lib", "delayimp.lib", "gdi32.lib", 
           "rpcrt4.lib", "shlwapi.lib", "wintrust.lib",
           "ws2_32.lib", "d3d11.lib", "glu32.lib", "imm32.lib", 
           "opengl32.lib", "oleacc.lib", "kernel32.lib", "user32.lib",
           "gdi32.lib", "winspool.lib", "shell32.lib", "ole32.lib", 
           "oleaut32.lib", "uuid.lib", "comdlg32.lib", "advapi32.lib",
           "Delayimp.lib"
        ];

        // see comments in etc/win/readme.md regarding
        // manifests on windows.
        if(delayLoad) // delayload makes for faster startup, not supported by clang-windows
        {
            lnkflags.push("/DELAYLOAD:libcef.dll",
                /* most generate a warning eg: 'no imports found from secur32.dll'
                "/DELAYLOAD:oleaut32.dll", "/DELAYLOAD:opengl32.dll", "/DELAYLOAD:d3d11.dll",  // used by tests/cefclient
                '/DELAYLOAD:"api-ms-win-core-winrt-error-l1-1-0.dll"',
                '/DELAYLOAD:"api-ms-win-core-winrt-l1-1-0.dll"', 
                '/DELAYLOAD:"api-ms-win-core-winrt-string-l1-1-0.dll"',
                "/DELAYLOAD:advapi32.dll", "/DELAYLOAD:comctl32.dll", 
                "/DELAYLOAD:comdlg32.dll", "/DELAYLOAD:credui.dll",
                "/DELAYLOAD:cryptui.dll", "/DELAYLOAD:d3d11.dll", 
                "/DELAYLOAD:d3d9.dll", "/DELAYLOAD:dwmapi.dll",
                "/DELAYLOAD:dxgi.dll", "/DELAYLOAD:dxva2.dll", 
                "/DELAYLOAD:esent.dll", "/DELAYLOAD:gdi32.dll",
                "/DELAYLOAD:hid.dll", "/DELAYLOAD:imagehlp.dll",
                "/DELAYLOAD:imm32.dll /DELAYLOAD:msi.dll",
                "/DELAYLOAD:netapi32.dll /DELAYLOAD:ncrypt.dll",
                "/DELAYLOAD:ole32.dll", "/DELAYLOAD:oleacc.dll",
                "/DELAYLOAD:propsys.dll", "/DELAYLOAD:psapi.dll",
                "/DELAYLOAD:rpcrt4.dll", "/DELAYLOAD:rstrtmgr.dll",
                "/DELAYLOAD:setupapi.dll", "/DELAYLOAD:shell32.dll",
                "/DELAYLOAD:shlwapi.dll", "/DELAYLOAD:uiautomationcore.dll",
                "/DELAYLOAD:urlmon.dll", "/DELAYLOAD:user32.dll",
                "/DELAYLOAD:usp10.dll", "/DELAYLOAD:uxtheme.dll",
                "/DELAYLOAD:wer.dll", "/DELAYLOAD:wevtapi.dll",
                "/DELAYLOAD:wininet.dll", "/DELAYLOAD:winusb.dll",
                "/DELAYLOAD:wsock32.dll", "/DELAYLOAD:wtsapi32.dll",
                "/DELAYLOAD:crypt32.dll", "/DELAYLOAD:dbghelp.dll",
                "/DELAYLOAD:dhcpcsvc.dll", "/DELAYLOAD:dwrite.dll",
                "/DELAYLOAD:iphlpapi.dll", "/DELAYLOAD:oleaut32.dll",
                "/DELAYLOAD:secur32.dll", "/DELAYLOAD:userenv.dll",
                "/DELAYLOAD:winhttp.dll", "/DELAYLOAD:winmm.dll",
                "/DELAYLOAD:winspool.drv", "/DELAYLOAD:wintrust.dll",
                "/DELAYLOAD:ws2_32.dll", "/DELAYLOAD:glu32.dll",
                "/DELAYLOAD:oleaut32.dll", "/DELAYLOAD:opengl32.dll",
            */
            );
        }
    } // win32 link

    /* ------------------------------------------------------------------- */
    appendDarwinClangFlags(cefProjState, debug)
    {
        let {ccflags} = cefProjState;
        if(debug)
            ccflags.push("-g"); // could add "-O0"?
        else
            ccflags.push("-O3");
        // no-rtti and no-exceptions are handled by buildvars
        // macosx-version-min and sdk are handled out-of-band.
        let flags = [
            "-fno-strict-aliasing", 
            "-fstack-protector",
            "-funwind-tables", 
            "-fvisibility=hidden",
            "-Wall", "-Werror", "-Wextra", "-Wendif-labels", "-Wnewline-eof", 
            "-Wno-missing-field-initializers", "-Wno-unused-parameter", 
            "-fno-threadsafe-statics", "-fobjc-call-cxx-cdtors", 
            "-fvisibility-inlines-hidden", "-Wno-narrowing", 
            "-Wsign-compare", "-Wno-undefined-var-template"];
        ccflags.push(...flags)
    }

    /* ------------------------------------------------------------------- */
    // build the binding between cpp and the dll's c-only interface.
    // result is an static archive (.a).
    addBindingToProj(cefProjState, proj)
    {
        proj.AddFrameworks([this.GetName()]);
        const fwdir = cefProjState.fwdir;
        proj.NewProject("CEFBinding", {
            ProjectDir:  jsmk.path.join(fwdir, "libcef_dll"),
            init: function(subProj)
            {
                // apply these only to the binding library
                // leave it up to project for its own code.
                subProj.SetBuildVar("CppNoExceptions", 1);
                subProj.SetBuildVar("CppNoRTTI", 1);

                // here's our binding module, produces .a (archive)
                let m = subProj.NewModule("CEFBinding_mod");
                let srcfiles = [];
                srcfiles.push(...subProj.Glob("*.cc"));
                srcfiles.push(...subProj.Glob("base/*.cc"));
                srcfiles.push(...subProj.Glob("cpptoc/*.cc"));
                srcfiles.push(...subProj.Glob("cpptoc/test/*.cc"));
                srcfiles.push(...subProj.Glob("cpptoc/views/*.cc"));
                srcfiles.push(...subProj.Glob("ctocpp/*.cc"));
                srcfiles.push(...subProj.Glob("ctocpp/views/*.cc"));
                srcfiles.push(...subProj.Glob("wrapper/*.cc"));
                let tcomp = m.NewTask("compileCEFBinding", "cpp->o", {
                        inputs: srcfiles, 
                    });
                let outputs = tcomp.GetOutputs();
                if(Platform == "darwin")
                {
                    let mmcomp = m.NewTask("compileCEFBinding", "cpp->o", {
                        inputs: subProj.Glob("wrapper/*.mm")
                    });
                    outputs.push(...mmcomp.GetOutputs());
                }
                m.NewTask("libCEFBinding", "o->a", {
                    inputs: outputs
                });
                cefProjState.cefBindingModule = m;
                if(cefProjState.libcef)
                    cefProjState.libs = [cefProjState.libcef, ...m.GetOutputs()];
                else
                {
                    // no libcef?
                    // - on darwin, we must dynamically load + resolve
                    //  this via Libraries/Chromium Embedded Framework
                    cefProjState.libs = [...m.GetOutputs()];
                }
            }
        }).EstablishBarrier("after");
    }

    addSimpleClientToProj(cefProjState, proj) // see tests/cefsimple/CMakeLists.txt
    {
        let subprojDir = `${cefProjState.fwdir}/tests/cefsimple`;
        let cfg = {
            cppinputs: [],
            rcinputs: []
        };

        cfg.cppinputs.push(
            "simple_app.cc", 
            "simple_handler.cc"
        );

        switch(cefProjState.plt) // platform
        {
        case "win32":
            cfg.rcinputs.push("win/cefsimple.rc");
            cfg.cppinputs.push(
                "cefsimple_win.cc",
                "simple_handler_win.cc"
            );
            break;
        case "darwin":
            cfg.cppinputs.push(
                "cefsimple_mac.mm",
                "simple_handler_mac.mm",
                "../shared/process_helper_mac.cc"
            );
            break;
        case "linux":
            throw new Error("implement me!");
        }
        this.CreateSubprojApp(proj, "CEFTestSimple", subprojDir, cfg);
    }

    addTestClientToProj(cefProjState, proj) // see tests/cefclient/CMakeLists.txt
    {
        let subprojDir = `${cefProjState.fwdir}/tests/cefclient`;
        let cfg = {
            cppinputs: [],
            rcinputs: []
        };

        cfg.cppinputs.push(
            "browser/base_client_handler.cc",
            "browser/binary_transfer_test.cc",
            "browser/binding_test.cc",
            "browser/browser_window.cc",
            "browser/bytes_write_handler.cc",
            "browser/client_app_delegates_browser.cc",
            "browser/client_browser.cc",
            "browser/client_handler.cc",
            "browser/client_handler_osr.cc",
            "browser/client_handler_std.cc",
            "browser/client_prefs.cc",
            "browser/config_test.cc",
            "browser/default_client_handler.cc",
            "browser/dialog_test.cc",
            "browser/hang_test.cc",
            "browser/image_cache.cc",
            "browser/main_context.cc",
            "browser/main_context_impl.cc",
            "browser/media_router_test.cc",
            "browser/osr_renderer.cc",
            "browser/preferences_test.cc",
            "browser/response_filter_test.cc",
            "browser/root_window.cc",
            "browser/root_window_create.cc",
            "browser/root_window_manager.cc",
            "browser/root_window_views.cc",
            "browser/scheme_test.cc",
            "browser/server_test.cc",
            "browser/task_manager_test.cc",
            "browser/test_runner.cc",
            "browser/urlrequest_test.cc",
            "browser/views_menu_bar.cc",
            "browser/views_overlay_browser.cc",
            "browser/views_overlay_controls.cc",
            "browser/views_style.cc",
            "browser/views_window.cc",
            "browser/window_test.cc",
            "browser/window_test_runner.cc",
            "browser/window_test_runner_views.cc",
            "common/client_app_delegates_common.cc",
            "common/scheme_test_common.cc",
            "renderer/client_app_delegates_renderer.cc",
            "renderer/client_renderer.cc",
            "renderer/ipc_performance_test.cc",
            "renderer/performance_test.cc",
            "renderer/performance_test_tests.cc",
            "../shared/browser/client_app_browser.cc",
            "../shared/browser/file_util.cc",
            "../shared/browser/geometry_util.cc",
            "../shared/browser/main_message_loop.cc",
            "../shared/browser/main_message_loop_external_pump.cc",
            "../shared/browser/main_message_loop_std.cc",
            "../shared/common/binary_value_utils.cc",
            "../shared/common/client_app.cc",
            "../shared/common/client_app_other.cc",
            "../shared/common/client_switches.cc",
            "../shared/common/string_util.cc",
            "../shared/renderer/client_app_renderer.cc",
        );

        switch(cefProjState.plt) // platform
        {
        case "win32":
            cfg.rcinputs.push("win/cefclient.rc");
            cfg.cppinputs.push(
                "cefclient_win.cc",
                "browser/browser_window_osr_win.cc",
                "browser/browser_window_std_win.cc",
                "browser/main_context_impl_win.cc",
                "browser/main_message_loop_multithreaded_win.cc",
                "browser/osr_accessibility_helper.cc",
                "browser/osr_accessibility_node.cc",
                "browser/osr_accessibility_node_win.cc",
                "browser/osr_d3d11_win.cc",
                "browser/osr_dragdrop_win.cc",
                "browser/osr_ime_handler_win.cc",
                "browser/osr_render_handler_win.cc",
                "browser/osr_render_handler_win_d3d11.cc",
                "browser/osr_render_handler_win_gl.cc",
                "browser/osr_window_win.cc",
                "browser/resource_util_win_idmap.cc",
                "browser/root_window_win.cc",
                "browser/temp_window_win.cc",
                "browser/window_test_runner_win.cc",
                "../shared/browser/main_message_loop_external_pump_win.cc",
                "../shared/browser/resource_util_win.cc",
                "../shared/browser/util_win.cc",

            );
            break;
        case "darwin":
            break;
        case "linux":
            throw new Error("implement me!");
        }
        this.CreateSubprojApp(proj, "CEFTestClient", subprojDir, cfg);
    }
}

exports.Framework = CEF;