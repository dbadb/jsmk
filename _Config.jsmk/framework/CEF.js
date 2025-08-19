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

const sDefaultCEFVers = "139"; // 8/25
const sDefaultConfigProj = "compileDLLBinding";

class CEF extends Framework
{
    // user's Project requests access to a framework by name and version.  
    constructor(name, version)
    {
        super(name, version);
        if(version == "default")
            this.m_version = sDefaultCEFVers;
    }

    ConfigureProject(proj, how=sDefaultConfigProj)
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
        cefProjState.arch = arch;
        cefProjState.plt = plt;
        cefProjState.key = key;
        cefProjState.deploy = proj.GetBuildVar("Deployment");
        cefProjState.fwdir = `_frameworks/CEF/${key}/${this.GetVersion()}`;
        cefProjState.incdirs = [cefProjState.fwdir]; // include/* found here.
        cefProjState.ccdefs = {
            // support for eg: UINT8_MAX, etc
            __STDC_CONSTANT_MACROS:null,
            __STDC_FORMAT_MACROS:null,
            CEF_USE_BOOTSTRAP: null,
            CEF_USE_ATL: null,
            WRAPPING_CEF_SHARED: 1,
        };
        cefProjState.ccflags = [];
        cefProjState.lnkflags = [] 
        cefProjState.instRoot = proj.EvaluateBuildVar("InstallDir");
        cefProjState.instInfo = proj.EvaluateBuildVar("InstallInfo");
        if(!cefProjState.instInfo)
            jsmk.NOTICE("CEF requires InstallInfo from embedding proj.");

        const debug = cefProjState.deploy == "debug";
        if(proj.GetBuildVar("CppStd") != "c++17")
        {
            jsmk.NOTICE("CEF overriding CppStd to c++17");
            proj.SetBuildVar("CppStd", "c++17");
        }
        cefProjState.syslibs = [];
        switch(plt)
        {
        case "win32":
            proj.SetBuildVar("Win32Console","static"); // CEF's preferred mode.
            cefProjState.ccdefs = Object.assign(cefProjState.ccdefs, {
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
            const pdir = jsmk.path.join(cefProjState.fwdir, (debug?"Debug":"Release")); 
            const rezdir = jsmk.path.join(cefProjState.fwdir, "Resources"); 
            // By default, CEF assumes all resources are in the same directory 
            // as the EXE (or libcef.dll).  At startup, you can override this 
            // with fields in cef_settings_t:
            //      resources_dir_path → where .pak files are located.
            //      locales_dir_path → where locales\ lives.
            cefProjState.libcef = jsmk.path.join(pdir,  "libcef.lib");
            cefProjState.runtimeComponents.bin = [
                jsmk.path.join(pdir, "bootstrap.exe"), // rename-me!
                    // -or- jsmk.path.join(pdir,  "bootstrapc.exe"), // rename-me!
                jsmk.path.join(pdir, "chrome_elf.dll"),
                jsmk.path.join(pdir, "d3dcompiler_47.dll"),
                jsmk.path.join(pdir, "dxcompiler.dll"),
                jsmk.path.join(pdir, "dxil.dll"),
                jsmk.path.join(pdir, "libcef.dll"),
                jsmk.path.join(pdir, "libEGL.dll"),
                jsmk.path.join(pdir, "libGLESv2.dll"),
                jsmk.path.join(pdir, "v8_context_snapshot.bin"),
                jsmk.path.join(pdir, "vk_swiftshader.dll"),
                jsmk.path.join(pdir, "vk_swiftshader_icd.json"),
                jsmk.path.join(pdir, "vulkan-1.dll"),
                jsmk.path.join(rezdir, "chrome_100_percent.pak"),
                jsmk.path.join(rezdir, "chrome_200_percent.pak"),
                jsmk.path.join(rezdir, "icudtl.dat"),
                jsmk.path.join(rezdir, "locales"), // directory
                jsmk.path.join(rezdir, "resources.pak"),
            ];
            if(tsname == "clang")
                this.appendWin32ClangFlags(cefProjState, debug);
            else
                this.appendMSVFlags(cefProjState, debug);
            break;
        case "darwin":
            break;
        case "linux":
            break;
        }

        for(let h of how)
        {
            switch(h)
            {
            case sDefaultConfigProj:
                this.addBindingToProj(cefProjState, proj);
                break;
            case "buildTestClient":
                this.addTestClientToProj(cefProjState, proj);
                break;
            default:
                throw Error(`CEF can't config project ${h}`);
            }
        }
    }

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
            "-EHsc", 
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
            "-fno-exceptions", //  Disable exceptions
            "-fno-rtti", //  Disable real-time type information
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
        if(delayLoad) // delayload makes for faster startup, not supported by clang-windows
        {
            lnkflags.push("/DELAYLOAD:libcef.dll",
                "/DELAYLOAD:oleaut32.dll", "/DELAYLOAD:opengl32.dll",
                "/DELAYLOAD:d3d11.dll", 
                /* most generate a warning eg: 'no imports found from secur32.dll'
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
    }

    // cl.exe _frameworks/CEF/x86_64-win32/139/libcef_dll/ctocpp/media_router_ctocpp.cc 
    //   -Fo_built/vs22-x86_64-win32-avx2-debug/CEFBinding/media_router_ctocpp.cc.obj 
    //   -I_frameworks/CEF/x86_64-win32/139 
    //    /MTd /RTC1 /Od /Ob0 /Zi /MP /Gy /GR- /W4 /WX 
    //    /Gm- /EHsc /GS /fp:precise /Zc:wchar_t /Zc:forScope /Zc:inline /std:c++17 
    //    /wd4100 /wd4127 /wd4244 /wd4324 /wd4481 /wd4512 /wd4701 /wd4702 /wd4996 -c 
    //    -EHsc -Gd -Gm- -GS- -Gy -W3 -WX- -Zc:__cplusplus -TP -Zc:inline 
    //   -Zc:wchar_t -Zc:forScope -showIncludes -std:c++17 
    //   -FdC:/Users/dana/Documents/src/github.cannerycoders/CEFapp/_built/vs22-x86_64-win32-avx2-debug/CEFBinding/media_router_ctocpp.cc.obj.pdb 
    //   -Ob0 -Od -RTC1 -Zi -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS 
    //   -DCEF_USE_BOOTSTRAP -DCEF_USE_ATL -DWRAPPING_CEF_SHARED -DNOMINMAX -DWINVER=0x0A00 
    //   -D_WIN32_WINNT=0x0A00 -DNTDDI_VERSION=NTDDI_WIN10_FE -DWIN32_LEAN_AND_MEAN 
    //   -D_HAS_EXCEPTIONS=0 -DUNICODE -D_UNICODE -D_CRT_SECURE_NO_WARNINGS -D_WIN32 
    //   -DWIN32 -D_DEBUG

    ConfigureTaskSettings(task)
    {
        const cefProjState = task.GetBuildVar("CEFProjState");
        let tool = task.GetTool();
        let r = tool.GetRole();
        switch(r)
        {
        case Tool.Role.Compile:
            if(task.GetRule() == "rc->o")
                jsmk.NOTICE("rccompile");
            else
            if(cefProjState.ccflags)
                task.AddFlags(r, cefProjState.ccflags);
            if(cefProjState.incdirs)
                task.AddSearchpaths(r, cefProjState.incdirs);
            if(cefProjState.ccdefs)
                task.Define(cefProjState.ccdefs);
            break;
        case Tool.Role.Link:
        case Tool.Role.Archive:
            case Tool.Role.ArchiveDynamic:
                if(cefProjState.lnkflags)
                    task.AddFlags(r, cefProjState.lnkflags);
                if(cefProjState.libs)
                    task.AddLibs(cefProjState.libs);
                if(cefProjState.syslibs)
                    task.AddLibs(cefProjState.syslibs);
                break;
            }
        }

        addBindingToProj(cefProjState, proj)
        {
            proj.AddFrameworks([this.GetName()]);

            let m = proj.NewModule("CEFBinding");
            let srcfiles = [];
            let fwdir = cefProjState.fwdir;
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/base/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/cpptoc/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/cpptoc/test/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/cpptoc/views/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/ctocpp/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/ctocpp/views/*.cc`));
            srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/wrapper/*.cc`));
            let tcomp = m.NewTask("compileCEFBinding", "cpp->o", {
                            inputs: srcfiles, 
                        });
            m.NewTask("libCEFBinding", "o->a", {
                inputs: tcomp.GetOutputs(),
            });
            cefProjState.cefBindingModule = m;
            cefProjState.libs = [cefProjState.libcef, ...m.GetOutputs()];
        }

        addTestClientToProj(cefProjState, proj) // see tests/cefclient/CMakeLists.txt
        {
            const m = proj.NewModule("CEFTestClient");
            const srcdir = jsmk.path.join(cefProjState.fwdir, "tests");
            const clientRC = {
                win32: [`${srcdir}/cefclient/win/cefclient.rc`],
            }[cefProjState.plt] || [];
            const clientPlatformSrc = {
                win32: [
                    "cefclient/cefclient_win.cc",
                    "cefclient/browser/browser_window_osr_win.cc",
                    "cefclient/browser/browser_window_std_win.cc",
                    "cefclient/browser/main_context_impl_win.cc",
                    "cefclient/browser/main_message_loop_multithreaded_win.cc",
                    "cefclient/browser/osr_accessibility_helper.cc",
                    "cefclient/browser/osr_accessibility_node.cc",
                    "cefclient/browser/osr_accessibility_node_win.cc",
                    "cefclient/browser/osr_d3d11_win.cc",
                    "cefclient/browser/osr_dragdrop_win.cc",
                    "cefclient/browser/osr_ime_handler_win.cc",
                    "cefclient/browser/osr_render_handler_win.cc",
                    "cefclient/browser/osr_render_handler_win_d3d11.cc",
                    "cefclient/browser/osr_render_handler_win_gl.cc",
                    "cefclient/browser/osr_window_win.cc",
                    "cefclient/browser/resource_util_win_idmap.cc",
                    "cefclient/browser/root_window_win.cc",
                    "cefclient/browser/temp_window_win.cc",
                    "cefclient/browser/window_test_runner_win.cc",
                    "shared/browser/main_message_loop_external_pump_win.cc",
                    "shared/browser/resource_util_win.cc",
                    "shared/browser/util_win.cc",
                ],
            }[cefProjState.plt];
            const clientBrowserSrc = [
                "cefclient/browser/base_client_handler.cc",
                "cefclient/browser/binary_transfer_test.cc",
                "cefclient/browser/binding_test.cc",
                "cefclient/browser/browser_window.cc",
                "cefclient/browser/bytes_write_handler.cc",
                "cefclient/browser/client_app_delegates_browser.cc",
                "cefclient/browser/client_browser.cc",
                "cefclient/browser/client_handler.cc",
                "cefclient/browser/client_handler_osr.cc",
                "cefclient/browser/client_handler_std.cc",
                "cefclient/browser/client_prefs.cc",
                "cefclient/browser/config_test.cc",
                "cefclient/browser/default_client_handler.cc",
                "cefclient/browser/dialog_test.cc",
                "cefclient/browser/hang_test.cc",
                "cefclient/browser/image_cache.cc",
                "cefclient/browser/main_context.cc",
                "cefclient/browser/main_context_impl.cc",
                "cefclient/browser/media_router_test.cc",
                "cefclient/browser/osr_renderer.cc",
                "cefclient/browser/preferences_test.cc",
                "cefclient/browser/response_filter_test.cc",
                "cefclient/browser/root_window.cc",
                "cefclient/browser/root_window_create.cc",
                "cefclient/browser/root_window_manager.cc",
                "cefclient/browser/root_window_views.cc",
                "cefclient/browser/scheme_test.cc",
                "cefclient/browser/server_test.cc",
                "cefclient/browser/task_manager_test.cc",
                "cefclient/browser/test_runner.cc",
                "cefclient/browser/urlrequest_test.cc",
                "cefclient/browser/views_menu_bar.cc",
                "cefclient/browser/views_overlay_browser.cc",
                "cefclient/browser/views_overlay_controls.cc",
                "cefclient/browser/views_style.cc",
                "cefclient/browser/views_window.cc",
                "cefclient/browser/window_test.cc",
                "cefclient/browser/window_test_runner.cc",
                "cefclient/browser/window_test_runner_views.cc",
            ];
            const clientCommonSrc = [
                "cefclient/common/client_app_delegates_common.cc",
                "cefclient/common/scheme_test_common.cc",
            ];
            const clientRendererSrc = [
                "cefclient/renderer/client_app_delegates_renderer.cc",
                "cefclient/renderer/client_renderer.cc",
                "cefclient/renderer/ipc_performance_test.cc",
                "cefclient/renderer/performance_test.cc",
                "cefclient/renderer/performance_test_tests.cc",
            ];

            const sharedBrowserSrc = [
                "shared/browser/client_app_browser.cc",
                "shared/browser/file_util.cc",
                "shared/browser/geometry_util.cc",
                "shared/browser/main_message_loop.cc",
                "shared/browser/main_message_loop_external_pump.cc",
                "shared/browser/main_message_loop_std.cc",
            ];
            const sharedCommonSrc = [
                "shared/common/binary_value_utils.cc",
                "shared/common/client_app.cc",
                "shared/common/client_app_other.cc",
                "shared/common/client_switches.cc",
                "shared/common/string_util.cc",
            ];
            const sharedRendererSrc = [
                "shared/renderer/client_app_renderer.cc",
            ];
            const tcomp = m.NewTask("ccTestClient", "cpp->o", {
                inputs: [...clientBrowserSrc, ...clientCommonSrc,  ...clientRendererSrc,
                        ...clientPlatformSrc,
                        ...sharedBrowserSrc, ...sharedCommonSrc, ...sharedRendererSrc,
                        ].map((v) => jsmk.path.join(srcdir,v)),
            });

            const rccomp = m.NewTask("rcTestClient", "rc->o", {
                            inputs: clientRC,
                        });

        // nb: crt static-vs-dynamic is controlled by -MT vs -MD flags 
        //     at compile-time
        const tlink = m.NewTask("CEFTestClient", "cpp.o->so", {
            inputs: [...tcomp.GetOutputs(), ...rccomp.GetOutputs()],
            // add link flags, etc.
        });
        // on windows, this dll exports RunWinMain

        m.NewTask("installCEFTestClient", "install", {
            inputs: tlink.GetOutputs(),
            installdir: cefProjState.instInfo.binDir
        });
        m.NewTask("installCEFRuntimeBin", "install", {
            inputs: cefProjState.runtimeComponents.bin,
            installdir: cefProjState.instInfo.binDir,
            renametarget: (tname) =>
            {
                if(!tname.includes("bootstrap")) return tname;
                return tname.replace(/bootstrap/, "CEFTestClient");
            },
        });
        m.NewTask("installCEFRuntimeRez", "install", {
            inputs: cefProjState.runtimeComponents.resources,
            installdir: cefProjState.instInfo.resourceDir
        });
    }
}

exports.Framework = CEF;