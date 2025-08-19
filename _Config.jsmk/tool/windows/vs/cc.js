/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;
let Arch = jsmk.Require("toolset.js").Arch;

class cl extends ToolCli
{
    constructor(ts, vsvers, asC)
    {
        let arg0 = jsmk.path.resolveExeFile("cl", ts.BuildVars.VSToolsDir);
        if(!arg0) throw new Error("Can't resolve cl.exe " +
                                    ts.BuildVars.VSToolsDir);
        super(ts, `vs${vsvers}cc`,
                {
                    Role: ToolCli.Role.Compile,
                    Semantics: ToolCli.Semantics.ManyToMany,
                    DstExt: "obj",
                    ActionStage: "build",
                    Invocation: [arg0,
                            "${SRCFILE} -Fo${DSTFILE} ${SEARCHPATHS} " +
                            "${FLAGS} ${DEFINES}"],
                    Syntax: {
                        Define: "-D${KEY}=${VAL}",
                        DefineNoVal: "-D${KEY}",
                        Searchpath: "-I${VAL}",
                        Flag: "${VAL}"
                    },
            });

        this.target = asC ? "c" : "cpp";
        this.defaultStd = {
            "cpp": "c++14", 
            "c": null,
        }[this.target];

        this.AddFlags(this.GetRole(), [
            "-c",
            "-EHsc", // C++ exceptions
            // "-fp:precise",
            "-Gd",   // specifies __cdecl calling convention for ...
            "-Gm-", // minimal rebuild disabled (for now)
            // "-GR-", // disabled RTTI  (leave this to projects)
            // "-GS-", // no security checks
            "-Gy", // separate functions for linker
            // "-W3", // warning level
            // "-WX-", // warnings aren't errors
            "-Zc:__cplusplus", // https://devblogs.microsoft.com/cppblog/msvc-now-correctly-reports-__cplusplus/
            asC ?  "-TC" : "-TP",
            "-Zc:inline", //
            "-Zc:wchar_t",
            "-Zc:forScope",
            "-showIncludes"
        ]);

        this.Define({
            "_WIN32": null, // this should already be present but doesn't hurt
            "WIN32": null, // nb: this isn't conventional
        });
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);

        let flags = [];
        let defs = {};
        switch(this.target)
        {
        case "c":
            {
                let std = task.BuildVars.CStd || this.defaultStd;
                if(std)
                    flags.push(`-std:${std}`);
            }
            break;
        case "cpp":
            {
                let std = task.BuildVars.CppStd || this.defaultStd;
                if(std)
                    flags.push(`-std:${std}`);
            }
            break;
        }

        let cmode = task.BuildVars.Win32Console || "dynamic";
        switch(task.BuildVars.Win32Console || "dynamic")
        {
        case "dynamic":
            if(task.BuildVars.Deployment == "debug")
                flags.push("-MDd");
            else
                flags.push("-MD");
            break;
        case "static":
            if(task.BuildVars.Deployment == "debug")
                flags.push("-MTd");
            else
                flags.push("-MT");
            break;
        default:
            throw new Error("Unimplemented Win32Console mode " + cmode);
        }

        if(task.BuildVars.WinConsole)
        {

        }

        switch(task.BuildVars.Deployment)
        {
        case "debug":
            defs._DEBUG = null;
            flags.push(...[
                "-Fd${DSTFILE}.pdb",
                "-Ob0", // inline expansion
                "-Od",  // disable optimizations
                "-RTC1", // runtime error checking
                "-Zi",  // generates complete debugging info
            ]);
            break;
        case "release":
            defs.NDEBUG = null;
            flags.push(...[
                "-O3",
                "-Ob2", // inline expansion
            ]);
            break;
        case "releasesym":
            defs.NDEBUG = null;
            flags.push(...[
                "-O3",
                "-Ob1", // inline expansion
                "-Zi",  // debugging symbols
            ]);
            break;
        }

        let config = task.GetToolConfig();
        if(config)
        {
            switch(config.isa)
            {
            case "SSE2":
                flags.push("-QxSSE2");
                break;
            case "SSE3":
                flags = flags.push("QxSSE3");
                break;
            case "SSE42":
                flags = flags.push("-QxSSE4.2");
                break;
            case "AVX":
                flags = flags.push("-arch:AVX");
                break;
            case "AVX2":
                flags = flags.push("-arch:AVX2", "-QxCORE-AVX2");
                break;
            case "AVX512":
                break;
            }
        }
        if(defs)
            task.Define(defs);
        if(flags)
            task.AddFlags(this.GetRole(), flags);
    }

    outputIsDirty(output, inputs, cwd)
    {
        let dirty = super.outputIsDirty(output, inputs, cwd);
        if(!dirty)
        {
            // look for the .d file next to the output (created below)
            let depfileTxt = jsmk.file.read(output+".d");
            if(depfileTxt)
            {
                let depfiles = depfileTxt.split("\n");
                return super.outputIsDirty(output, depfiles, cwd);
            }
        }
        return dirty;
    }

    filterOutput(chan, txt, task, outfile)
    {
        if(chan === "stdout")
        {
            // eliminate compiler version dump
            if(0 === txt.indexOf("Microsoft"))
                return "";
        }
        else
        {
            // parse showInclude outputs:
            //  Note: including file: 
            let depfileMap = {};
            let lines = txt.split(/\r?\n/);
            let result = [];
            let rootDir = task.GetRootDir().toLowerCase();
            let quiet = true;
            for(let i in lines)
            {
                let line = lines[i];
                if(line.indexOf("Note: including file:") == 0)
                {
                    let filename = jsmk.path.normalize(line.split(/ +/).slice(3).join(" ")).toLowerCase();
                    if(jsmk.path.issubdir(filename, rootDir))
                    {
                        if(depfileMap[filename] === undefined)
                        {
                            depfileMap[filename] = true;
                        }
                    }
                    else
                    {
                       // jsmk.NOTICE("skipping dependency: " + filename + ` (${rootDir})`);
                    }
                }
                else
                {
                    if(line.indexOf("warning") != -1 ||
                        line.indexOf("error") != -1)
                    {
                        quiet = false;
                        result.push(line);
                    }
                }
            }
            let depfiles = Object.keys(depfileMap);
            if(depfiles.length > 0)
            {
                let depfile = outfile + ".d";
                jsmk.file.write(depfile, depfiles.join("\n"), function(err) {
                    if(err)
                        jsmk.ERROR("writing to ${depfile}: ${err}");
                    else
                        jsmk.DEBUG(`wrote dependencies to ${depfile}`);
                });
            }
            if(quiet)
               return "";
            else
                return result.join("\n");
        }
        return txt;
    }
}

class cc extends cl
{
    constructor(ts, vcvers)
    {
        super(ts, vcvers, true);
    }
}

exports.CC = cc;
exports.CPP = cl;


/* bgfx example:
    /I"..\..\..\..\bx\include\compat\msvc" 
    /I"..\..\..\..\bx\include" 
    /I"..\..\..\..\bimg\include" 
    /I"..\..\..\include" 
    /I"..\..\..\3rdparty" 
    /Fd"..\..\win64_vs2017\bin\example-glueRelease.pdb" # names a .pdb file
    /D "__STDC_LIMIT_MACROS" 
    /D "__STDC_FORMAT_MACROS" 
    /D "__STDC_CONSTANT_MACROS" 
    /D "NDEBUG" 
    /D "WIN32" 
    /D "_WIN32" 
    /D "_HAS_EXCEPTIONS=0" 
    /D "_HAS_ITERATOR_DEBUGGING=0" 
    /D "_SCL_SECURE=0" 
    /D "_SECURE_SCL=0" 
    /D "_SCL_SECURE_NO_WARNINGS" 
    /D "_CRT_SECURE_NO_WARNINGS" 
    /D "_CRT_SECURE_NO_DEPRECATE" 
    /D "_WIN64" /errorReport:prompt 
    /FC  # fullpaths in diagnostics
    /Gd  # cdecl calling convention
    /GF # read-only string pooling 
    /Gm- # minimal rebuild disabled
    /GR-  # disabled RTTI
    /GS-  # no security checks
    /Gy   # separate functions for linker
    /O2   # creates fast code
    /Oy # omit frame pointers on call stack
    /fp:precise 
    /MP   # parallel build
    /MT  # multithreaded
    /W4  # warnings
    /WX-  # warnings aren't errors
    /Zc:inline /Zc:forScope /Zc:wchar_t 
    /Zi 
    /nologo 
    /Fa"${HOME}\src\bgfx\nih\bgfx\bgfx\.build\projects\vs2017\..\..\win64_vs2017\obj\x64\Release\example-glue\" 
    /Fo"${HOME}\src\bgfx\nih\bgfx\bgfx\.build\projects\vs2017\..\..\win64_vs2017\obj\x64\Release\example-glue\" 
    /Fp"${HOME}\src\bgfx\nih\bgfx\bgfx\.build\projects\vs2017\..\..\win64_vs2017\obj\x64\Release\example-glue\example-glueRelease.pch" 
    /diagnostics:classic
/*

Microsoft (R) C/C++ Optimizing Compiler Version 19.00.24215.1 for x86
Copyright (C) Microsoft Corporation.  All rights reserved.

https://docs.microsoft.com/en-us/cpp/build/reference/compiler-options-listed-alphabetically

                         C/C++ COMPILER OPTIONS

                              -OPTIMIZATION-

/O1 minimize space                      /O2 maximize speed
/Ob<n> inline expansion (default n=0)   /Od disable optimizations (default)
/Og enable global optimization          /Oi[-] enable intrinsic functions
/Os favor code space                    /Ot favor code speed
/Ox maximum optimizations               /Oy[-] enable frame pointer omission
/favor:<blend|ATOM> select processor to optimize for, one of:
    blend - a combination of optimizations for several different x86 processors
    ATOM - Intel(R) Atom(TM) processors

                             -CODE GENERATION-

/Gw[-] separate global variables for linker
/GF enable read-only string pooling     /Gm[-] enable minimal rebuild
/Gy[-] separate functions for linker    /GS[-] enable security checks
/GR[-] enable C++ RTTI                  /GX[-] enable C++ EH (same as /EHsc)
/guard:cf[-] enable CFG (control flow guard)
/EHs enable C++ EH (no SEH exceptions)  /EHa enable C++ EH (w/ SEH exceptions)
/EHc extern "C" defaults to nothrow
/EHr always generate noexcept runtime termination checks
/fp:<except[-]|fast|precise|strict> choose floating-point model:
    except[-] - consider floating-point exceptions when generating code
    fast - "fast" floating-point model; results are less predictable
    precise - "precise" floating-point model; results are predictable
    strict - "strict" floating-point model (implies /fp:except)
/Qfast_transcendentals generate inline FP intrinsics even with /fp:except
/Qpar[-] enable parallel code generation
/Qpar-report:1 auto-parallelizer diagnostic; indicate parallelized loops
/Qpar-report:2 auto-parallelizer diagnostic; indicate loops not parallelized
/Qvec-report:1 auto-vectorizer diagnostic; indicate vectorized loops
/Qvec-report:2 auto-vectorizer diagnostic; indicate loops not vectorized
/GL[-] enable link-time code generation
/volatile:<iso|ms> choose volatile model:
    iso - Acquire/release semantics not guaranteed on volatile accesses
    ms  - Acquire/release semantics guaranteed on volatile accesses
/GA optimize for Windows Application    /Ge force stack checking for all funcs
/Gs[num] control stack checking calls   /Gh enable _penter function call
/GH enable _pexit function call         /GT generate fiber-safe TLS accesses
/RTC1 Enable fast checks (/RTCsu)       /RTCc Convert to smaller type checks
/RTCs Stack Frame runtime checking      /RTCu Uninitialized local usage checks
/clr[:option] compile for common language runtime, where option is:
    pure - produce IL-only output file (no native executable code)
    safe - produce IL-only verifiable output file
    initialAppDomain - enable initial AppDomain behavior of Visual C++ 2002
    noAssembly - do not produce an assembly
    nostdlib - ignore the default \clr directory
/Gd __cdecl calling convention          /Gr __fastcall calling convention
/Gz __stdcall calling convention        /GZ Enable stack checks (/RTCs)
/Gv __vectorcall calling convention     /QIfist[-] use FIST instead of ftol()
/hotpatch ensure function padding for hotpatchable images
/arch:<IA32|SSE|SSE2|AVX|AVX2> minimum CPU architecture requirements, one of:
   IA32 - use no enhanced instructions and use x87 for floating point
   SSE - enable use of instructions available with SSE-enabled CPUs
   SSE2 - (default) enable use of instructions available with SSE2-enabled CPUs
   AVX - enable use of instructions available with AVX-enabled CPUs
   AVX2 - enable use of instructions available with AVX2-enabled CPUs
/Qimprecise_fwaits generate FWAITs only on "try" boundaries, not inside "try"
/Qsafe_fp_loads generate safe FP loads

                              -OUTPUT FILES-

/Fa[file] name assembly listing file    /FA[scu] configure assembly listing
/Fd[file] name .PDB file                /Fe<file> name executable file
/Fm[file] name map file                 /Fo<file> name object file
/Fp<file> name precompiled header file  /Fr[file] name source browser file
/FR[file] name extended .SBR file       /Fi[file] name preprocessed file
/Fd: <file> name .PDB file              /Fe: <file> name executable file
/Fm: <file> name map file               /Fo: <file> name object file
/Fp: <file> name .PCH file              /FR: <file> name extended .SBR file
/Fi: <file> name preprocessed file
/doc[file] process XML documentation comments and optionally name the .xdc file

                              -PREPROCESSOR-

/AI<dir> add to assembly search path    /FU<file> forced using assembly/module
/C don't strip comments                 /D<name>{=|#}<text> define macro
/E preprocess to stdout                 /EP preprocess to stdout, no #line
/P preprocess to file                   /Fx merge injected code to file
/FI<file> name forced include file      /U<name> remove predefined macro
/u remove all predefined macros         /I<dir> add to include search path
/X ignore "standard places"

                                -LANGUAGE-

/Zi enable debugging information        /Z7 enable old-style debug info
/Zp[n] pack structs on n-byte boundary  /Za disable extensions
/Ze enable extensions (default)         /Zl omit default library name in .OBJ
/Zs syntax check only                   /vd{0|1|2} disable/enable vtordisp
/vm<x> type of pointers to members
/Zc:arg1[,arg2] C++ language conformance, where arguments can be:
  forScope[-]           enforce Standard C++ for scoping rules
  wchar_t[-]            wchar_t is the native type, not a typedef
  auto[-]               enforce the new Standard C++ meaning for auto
  trigraphs[-]          enable trigraphs (off by default)
  rvalueCast[-]         enforce Standard C++ explicit type conversion rules
  strictStrings[-]      disable string-literal to [char|wchar_t]*
                        conversion (off by default)
  implicitNoexcept[-]   enable implicit noexcept on required functions
  threadSafeInit[-]     enable thread-safe local static initialization
  inline[-]             remove unreferenced function or data if it is
                        COMDAT or has internal linkage only (off by default)
  sizedDealloc[-]       enable C++14 global sized deallocation
                        functions (on by default)
  throwingNew[-]        assume operator new throws on failure (off by default)
  referenceBinding[-]   a temporary will not bind to an non-const
                        lvalue reference (off by default)
/ZH:SHA_256             use SHA256 for file checksum in debug info (experimental)

/Zo[-] generate richer debugging information for optimized code (on by default)
/ZW enable WinRT language extensions
/constexpr:depth<N>     use <N> as the recursion depth limit
                        for constexpr (default: 512)
/constexpr:backtrace<N> show <N> constexpr evaluations
                        in diagnostics (default: 10)
/constexpr:steps<N>     terminate constexpr evaluation after
                        <N> steps (default: 100000)
/ZI enable Edit and Continue debug info
/openmp enable OpenMP 2.0 language extensions

                              -MISCELLANEOUS-

@<file> options response file           /?, /help print this help message
/bigobj generate extended object format /c compile only, no link
/errorReport:option Report internal compiler errors to Microsoft
    none - do not send report
    prompt - prompt to immediately send report
    queue - at next admin logon, prompt to send report (default)
    send - send report automatically
/FC use full pathnames in diagnostics   /H<num> max external name length
/J default char type is unsigned
/MP[n] use up to 'n' processes for compilation
/nologo suppress copyright message
/sdl enable additional security features and warnings
/showIncludes show include file names   /Tc<source file> compile file as .c
/Tp<source file> compile file as .cpp   /TC compile all files as .c
/TP compile all files as .cpp           /V<string> set version string
/w disable all warnings                 /wd<n> disable warning n
/we<n> treat warning n as an error      /wo<n> issue warning n once
/w<l><n> set warning level 1-4 for n    /W<n> set warning level (default n=1)
/Wall enable all warnings               /WL enable one line diagnostics
/WX treat warnings as errors            /Yc[file] create .PCH file
/Yd put debug info in every .OBJ        /Yl[sym] inject .PCH ref for debug lib
/Yu[file] use .PCH file                 /Y- disable all PCH options
/Zm<n> max memory alloc (% of default)  /FS force to use MSPDBSRV.EXE
/await enable resumable functions extension
/Wv:xx[.yy[.zzzzz]] disable warnings introduced after version xx.yy.zzzzz
/source-charset:<iana-name>|.nnnn set source character set
/execution-charset:<iana-name>|.nnnn set execution character set
/utf-8 set source and execution character set to UTF-8
/validate-charset[-] validate UTF-8 files for only legal characters

                                -LINKING-

/LD Create .DLL                         /LDd Create .DLL debug library
/LN Create a .netmodule                 /F<num> set stack size
/link [linker options and libraries]    /MD link with MSVCRT.LIB
/MT link with LIBCMT.LIB                /MDd link with MSVCRTD.LIB debug lib
/MTd link with LIBCMTD.LIB debug lib

                              -CODE ANALYSIS-

/analyze[-] Enable native analysis      /analyze:quiet[-] No warning to console
/analyze:log<name> Warnings to file     /analyze:autolog Log to *.pftlog
/analyze:autolog:ext<ext> Log to *.<ext>/analyze:autolog- No log file
/analyze:WX- Warnings not fatal         /analyze:stacksize<num> Max stack frame
/analyze:max_paths<num> Max paths       /analyze:only Analyze, no code gen




 C:/Progra~2/Microsoft\ Visual\ Studio 14.0/VC/bin/amd64/cl.exe civetweb/civetweb.c  \
    /Fo${HOME}/src/c++/github.com/tungsten/.built/vs14-x86_64-win32--debug/libthirdparty/civetweb.obj \
    /I${HOME}/src/c++/github.com/tungsten/src/core /I${HOME}/src/c++/github.com/tungsten/src/thirdparty \
    /c /EHsc /fp:precise /Gd /Gm- /GR /W3 /WX- /TP /Zc:inline \
    /Fd${HOME}/src/c++/github.com/tungsten/.built/vs14-x86_64-win32--debug/libthirdparty/civetweb.obj.pdb \
    /GS /MDd /Ob0 /Od /RTC1 /Zi /DEMBREE_STATIC_LIB=1 /DLODEPNG_NO_COMPILE_DISK=1 \
    /DRAPIDJSON_HAS_STDSTRING=1 /DSTBI_NO_STDIO=1 /DUSE_IPV6=1 /D_MBCS \
    /DINSTALL_PREFIX="dbadb_" /D__SSE__ /DCONSTEXPR=const /DNOMINMAX /D_DEBUG /DWIN32 \
    /D_WIN32 /D_WINDOWS /D_CRT_SECURE_NO_WARNINGS
*/
