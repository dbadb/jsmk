const ToolCli = jsmk.Require("tool_cli.js").Tool;

// Clang is a tool that provides cc, mm or c++, toolset expected
// to instantiate me thrice setting target appropriately.
// cc --version:
//  Apple clang version 12.0.0 (clang-1200.0.32.29)
//  Target: x86_64-apple-darwin20.3.0
//  Thread model: posix
//  InstalledDir: /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin

// https://clang.llvm.org/docs/ClangCommandLineReference.html 
// Stage Selection Options
//   -c (for compile),  none for all plus link
// Language Selection and Mode Options 
//  -std= *gnu11, gnu17, c17 or *gnu++14, gnu++17, c++17, etc. (* default)
//  -stdlib=libstdc++ and lib++
//  -rtlib=libgcc or compiler-rt
// Target Selection Options
//  -arch, -mmacosox-version-min -march=${cpu} where cpus are found by `cc --print-supported-cpus`
//      (supported cpus can be seen below)
// Code Generation Options
//  -O0, -O1, -O2, -O3, -Ofast, -Os, -Oz, -Og, -O, -O4
//  -g (works best with -O0)
//  -fexceptions (defaults to on)
//  also: fvisibility, tlsmodel
// Driver Options:
//  Wl,<args> for linker (also -Wa, -Wp, -Xanalyzer, ..)
//  -o <file>
// Preprocessor Options:
//  -Dk=v
//  -Uk
//  -include <filename>
//  -I <directory>
//  -F <directory>  (framework)
//  -nostdinc, nostdlibinc, -nobuiltininc
class Clang extends ToolCli
{
    constructor(ts, nm, target="c") // constructor called below
    { 
        let exe = {
            c: "clang",
            cpp: "clang++",
            mm: "clang++"
        }[target];

        let platform = jsmk.GetHost().Platform;
        let exepath = jsmk.path.join(ts.BuildVars.CLANG_BIN, exe);
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exe} ${ts.BuildVar.CLANG_BIN}`);
        super(ts, nm, 
        {
            Role: ToolCli.Role.Compile,
            Semantics: ToolCli.Semantics.ManyToMany,
            DstExt: "o",
            Invocation: [
                arg0, 
                "${SRCFILE}",
                "-o", 
                "${DSTFILE}",
                "${SEARCHPATHS}",
                "${FLAGS}",
                 "${DEFINES}",
            ],
            Syntax: {
                Define: "-D${KEY}=${VAL}",
                DefineNoVal: "-D${KEY}",
                Searchpath: "-I${VAL}",
                Flag: "${VAL}"
            },
        });

        this.target = target;
        let xflags = {
            darwin: [
                ["-isysroot", "${MACOSX_SDK}"],     
                "-mmacosx-version-min=10.15", // 14:mohave 15:catalina, 16:bigsur
            ],
            win32: [
                "-DWIN32",
                "-D_WIN32"
            ]
        }[platform];
        if(this.target == "mm")
            xflags.push("-ObjC++");
        this.defaultStd = {
            "cpp": "gnu++14", 
            "c": "gnu11",
            "mm": "gnu++14",
        }[this.target];
        this.AddFlags(this.GetRole(), 
        [
            "-c",
            ...xflags,
            "-Wall",
            "-ffast-math", // when not arm?
            "-MMD", // dependency file
        ]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        let flags = [];

        switch(this.target)
        {
        case "c":
            {
                let std = task.BuildVars.CStd || this.defaultStd;
                flags.push(`-std=${std}`);
            }
            break;
        case "cpp":
            {
                let std = task.BuildVars.CppStd || this.defaultStd;
                flags.push(`-std=${std}`);
            }
            break;
        }

        // Optimize for size. -Os enables all -O2 optimizations except 
        // those that often increase code size.  A Project/Root can
        // specify a default optimization regardless of Deployment.

        switch(task.BuildVars.OPTIMIZATION)
        {
        case "Size":
            flags.push("-Os");
            break;
        case "Speed":
            flags.push("-O3");
            break;
        case "Mixed":
            flags.push("-O2");
            break;
        case "None":
            flags.push("-O0"); // no-opt -> default
            break;
        default:
        case "Contextual":
            break;
        }
        switch(task.BuildVars.Deployment)
        {
        case "debug":
            flags.push("-g");
            break;
        case "release":
            if(flags.length == 0)
                flags.push("-O3");
            break;
        }
        if(flags.length)
            task.AddFlags(this.GetRole(), flags);
    }

    outputIsDirty(output, inputs, cwd)
    {
        let dirty = super.outputIsDirty(output, inputs, cwd);
        if(!dirty)
        {
            // also look for MMD output to see if any dependencies have changed

            let depfileTxt = jsmk.file.read(jsmk.file.changeExtension(output, "d"));
            if(depfileTxt)
            {
                let pat = /(?:[^\s]+\\ [^\s]+|[^\s]+)+/g;
                // pat looks for filenames, potentially with embedded spaces.
                // This also selects for line-continuation "\\" so we need
                // to filter that.
                // First line is the dependent file, so we slice it off.
                let files = depfileTxt.match(pat).filter((value)=>{
                    if(value[value.length-1] == ":")
                        return false;
                    else
                        return (value.length > 1);
                }).map((value)=>{
                    // Program\ Files -> Program Files
                    return value.replace(/\\ /g, " ");
                });
                return super.outputIsDirty(output, files, cwd);
            }
        }
        return dirty;
    }
}

class ClangPP extends Clang
{
    constructor(toolset, nm)
    {
        super(toolset, nm, "cpp");
    }
}

class ClangMM extends Clang
{
    constructor(toolset, nm)
    {
        super(toolset, nm, "mm");
    }
}

exports.CC = Clang;
exports.CPP = ClangPP;
exports.MM = ClangMM;

/* available cpus ---------------------------------------------------------

amdfam10
athlon
athlon-4
athlon-fx
athlon-mp
athlon-tbird
athlon-xp
athlon64
athlon64-sse3
atom
barcelona
bdver1
bdver2
bdver3
bdver4
bonnell
broadwell
btver1
btver2
c3
c3-2
cannonlake
cascadelake
cooperlake
core-avx-i
core-avx2
core2
corei7
corei7-avx
generic
geode
goldmont
goldmont-plus
haswell
i386
i486
i586
i686
icelake-client
icelake-server
ivybridge
k6
k6-2
k6-3
k8
k8-sse3
knl
knm
lakemont
nehalem
nocona
opteron
opteron-sse3
penryn
pentium
pentium-m
pentium-mmx
pentium2
pentium3
pentium3m
pentium4
pentium4m
pentiumpro
prescott
sandybridge
silvermont
skx
skylake
skylake-avx512
slm
tigerlake
tremont
westmere
winchip-c6
winchip2
x86-64
yonah
znver1
znver2

*/
