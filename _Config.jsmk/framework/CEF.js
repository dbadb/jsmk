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
        const ts = jsmk.GetActiveToolset();
        const tsname = ts.Name;
        const arch = ts.TargetArch;
        const plt = jsmk.GetHost().Platform;
        const key = `${arch}-${plt}`;
        this.m_arch = arch;
        this.m_plt = plt;
        this.m_key = key;
        this.m_deploy = proj.GetBuildVar("Deployment");
        this.m_fwdir = `_frameworks/CEF/${key}/${this.GetVersion()}`;
        this.m_incdirs = [this.m_fwdir]; // include/* found here.
        this.m_ccdefs = {
            // support for eg: UINT8_MAX, etc
            __STDC_CONSTANT_MACROS:null,
            __STDC_FORMAT_MACROS:null,
            CEF_USE_BOOTSTRAP: null,
            CEF_USE_ATL: null,
            WRAPPING_CEF_SHARED: null,
        };
        this.m_ccflags = [];
        this.m_lnkflags = [];
        switch(plt)
        {
        case "win32":
            this.m_ccdefs = Object.assign(this.m_ccdefs, {
                NOMINMAX: null,
                WINVER: "0x0A00",
                _WIN32_WINNT: "0x0A00",
                NTDDI_VERSION: "NTDDI_WIN10_FE",
                WIN32_LEAN_AND_MEAN: null,
                _HAS_EXCEPTIONS: 0,
                UNICODE: null,
                _UNICODE: null,
            });
            if(tsname == "clang")
                this.appendClangFlags(this.m_ccflags, this.m_deploy==="debug");
            else
                this.appendMSVFlags(this.m_ccflags, this.m_deploy==="debug");
            break;
        case "darwin":
            break;
        case "linux":
            break;
        }
        switch(how)
        {
        case sDefaultConfigProj:
            this.addBindingToProj(proj);
            break;
        default:
            throw Error(`CEF can't config project ${how}`);
        }
    }

    appendClangFlags(ccflags, debug)
    {
        if(debug)
            ccflags.push("-O0", "-g");
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
            "-std=c++17", //  Use the C++17 language standard
            "-Wno-narrowing", //  Don't warn about type narrowing
            "-Wsign-compare", //  Warn about mixed signed/unsigned type comparisons
            "-Wno-undefined-var-template", // Don't warn about potentially uninstantiated static members
        );
        if(this.m_plt == "win32")
            ccflags.push("-Wno-cast-function-type"); // cef_util_win.cc
    }

    appendMSVFlags(ccflags, debug)
    {
        if(debug)
        {
            ccflags.push(
                "/MTd",
                "/RTC1", // disable optimizations
                "/Od",
                "/Ob0"
            );
        }
        else
        {
            ccflags.push(
                "/MT",
                "/O2", // max speeed
                "/Ob2", // inline
                "/GF", // string pooling
            );
        }
        ccflags.push(
            "/Zi",
            "/MP", // multiprocess, not needed since we parallelize
            "/Gy",  // function-level linking
            "/GR-", // disable RTTI
            "/W4", // warning level
            "/WX", // warnings are errors
            "/Gm-", 
            "/EHsc", 
            "/GS", 
            "/fp:precise", 
            "/Zc:wchar_t", "/Zc:forScope", "/Zc:inline", 
            "/std:c++17",
            "/wd4100", // Ignore "unreferenced formal parameter" warning
            "/wd4127", // Ignore "conditional expression is constant" warning
            "/wd4244", // Ignore "conversion possible loss of data" warning
            "/wd4324", // Ignore "structure was padded due to alignment specifier" warning
            "/wd4481", // Ignore "nonstandard extension used: override" warning
            "/wd4512", // Ignore "assignment operator could not be generated" warning
            "/wd4701", // Ignore "potentially uninitialized local variable" warning
            "/wd4702", // Ignore "unreachable code" warning
            "/wd4996", // Ignore "function or variable may be unsafe" warning
        );
    }

    ConfigureTaskSettings(task)
    {
        let tool = task.GetTool();
        let r = tool.GetRole();
        switch(r)
        {
        case Tool.Role.Compile:
            if(this.m_incdirs)
                task.AddSearchpaths(r, this.m_incdirs);
            if(this.m_ccflags)
                task.AddFlags(r, this.m_ccflags);
            if(this.m_ccdefs)
                task.Define(this.m_ccdefs);
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            if(this.m_lnklags)
                task.AddFlags(r, this.m_lnkflags);
            if(this.m_libs)
                task.AddLibs(this.m_libs);
            break;
        }
    }

    addBindingToProj(proj)
    {
        proj.AddFrameworks([this.GetName()]);

        let m = proj.NewModule("CEFBinding");
        let srcfiles = [];
        let fwdir = this.m_fwdir;
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/*.cc`));
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/base/*.cc`));
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/cpptoc/*.cc`));
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/cpptoc/test/*.cc`));
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/cpptoc/views/*.cc`));
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/ctocpp/*.cc`));
        srcfiles.push(...proj.Glob(`${fwdir}/libcef_dll/wrapper/*.cc`));
        let tcomp = m.NewTask("compileCEFBinding", "cpp->o", {
                        inputs: srcfiles, 
                    });
        m.NewTask("libCEFBinding", "o->a", {
            inputs: tcomp.GetOutputs(),
        });
    }
}

exports.Framework = CEF;


/* windebug msvc
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.44.35207\bin\HostX64\x64\CL.exe /c 
/I"C:\Users\dana\Documents\src\github.cannerycoders\CEFapp\_frameworks\CEF\x86_64-win32\139" 
/Zi /nologo 
/W4 /WX 
/diagnostics:column /MP /Od /Ob0 
/D _UNICODE /D UNICODE /D WIN32 /D _WINDOWS /D __STDC_CONSTANT_MACROS /D __STDC_FORMAT_MACROS /D _WIN32 
/D UNICODE /D _UNICODE /D WINVER=0x0A00 /D _WIN32_WINNT=0x0A00 /D NTDDI_VERSION=NTDDI_WIN10_FE 
/D NOMINMAX /D WIN32_LEAN_AND_MEAN 
/D _HAS_EXCEPTIONS=0 /D CEF_USE_BOOTSTRAP /D CEF_USE_ATL /D WRAPPING_CEF_SHARED 
/D "CMAKE_INTDIR=\"Debug\"" 
/Gm- /EHsc /RTC1 /MTd /GS /Gy /fp:precise /Zc:wchar_t /Zc:forScope /Zc:inline /GR- /std:c++17 
/Fo"libcef_dll_wrapper.dir\Debug\\" /Fd"C:\Users\dana\Documents\src\github.cannerycoders\CEFapp\_frameworks\CEF\x86_64-win32\139\build\libcef_dll_wrapper\Debug\libcef_dll_wrapper.pdb" 
/external:W4 /Gd /TP /wd4100 /wd4127 /wd4244 /wd4324 /wd4481 /wd4512 /wd4701 /wd4702 /wd4996 /errorReport:prompt 
*/