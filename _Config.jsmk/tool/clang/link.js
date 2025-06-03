/* global jsmk */
let ToolCli = jsmk.Require("tool_cli.js").Tool;

// xxx: eg: need to include fluidsynth.dylibs in package and ensure that we load
//  the correct version relative to the executable (ie: chuck or a chugin).
// https://medium.com/@donblas/fun-with-rpath-otool-and-install-name-tool-e3e41ae86172
// http://clarkkromenaker.com/post/library-dynamic-loading-mac/ 
// https://stackoverflow.com/questions/2092378/macosx-how-to-collect-dependencies-into-a-local-bundle

class Link extends ToolCli
{
    constructor(ts, buildso=false)
    {
        // XXX: we really should use target-platform.
        //  currently it appears that we're loaded prior
        //  to knowing this and util.js PlatformInit.

        // NB: on clang-for-vs/windows, we currently don't use the special 
        // clang-cl driver because it produces many more errors.
        // we *do* apparently need: -fms-runtime-lib=dll_dbg or dll
        // to guide its choice of c-runtime. dll->MSVCRT, dll_dbg->MSVCRTD
        // NB: current this is required in both cc and link.
        let platform = jsmk.GetHost().Platform;
        let exe = GetClangDriver(platform, "link");
        let exepath = jsmk.path.join(ts.BuildVars.CLANG_BIN, exe);
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exe} ${ts.BuildVar.CLANG_BIN}`);
        let Role = buildso ? ToolCli.Role.ArchiveDynamic : ToolCli.Role.Link;
        let DstExt; 
        switch(platform)
        {
        case "darwin":
            DstExt = buildso ? "dylib" : "";
            break;
        case "win32":
            DstExt = buildso ? "dll" : "exe";
            break;
        default:
            DstExt = buildso ? "so" : "";
            break;
        }
        super(ts, "clang/link",
            {
                Role,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt,
                ActionStage: "build",
                Invocation: [arg0, 
                    "-o ${DSTFILE} ${SRCFILES} ${FLAGS} ${SEARCHPATHS} ${LIBS}"],
                Syntax:
                {
                    Flag: "${VAL}",
                    Lib: "${VAL}", // -l libs can be handled as flags (?)
                    Framework: "-framework ${VAL}",
                    Searchpath: "-L${VAL}"
                },
            }
        );
        // https://setapp.com/how-to/full-list-of-all-macos-versions
        // keep in sync with cc.js (12.0, 2021 monterey)
        //   15.0 sequoia, 2024 
        let flags = {
            darwin: [
                ["-isysroot", "${MACOSX_SDK}"],     
                "-mmacosx-version-min=15.0", 
            ],
            win32: [
            ]
        }[platform];
        this.AddFlags(this.GetRole(), flags);
        if(buildso)
            this.AddFlags(this.GetRole(), ["-fPIC", "-shared"]);
        // else "-execute" (the default)
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);

        let platform = jsmk.GetTargetPlatform();
        let linktype = this.GetRole() == ToolCli.Role.Link ? "exe" : "dso";
        let flags = GetClangFlags(platform, task.BuildVars.Deployment, linktype);
        if(flags)
            task.AddFlags(flags);

        // console.log(`${this.m_name} ${this.m_role} ${this.m_dstExt}`);
        if(this.m_dstExt == "dylib") // macos-only
        {
            task.AddFlags([["-install_name", task.GetName()]]);
            let vers = task.GetBuildVar("VERSION");
            if(vers)
                task.AddFlags([["-current_version", vers]]);
        }
    }

    // we override getInvocation to get a last crack at the commandline.
    getInvocation(task, inputs, outputs)
    {
        let result = super.getInvocation(task, inputs, outputs);
        let platform = jsmk.GetTargetPlatform();
        let deployment = task.BuildVars.Deployment;
        let libs = getClangLibs(platform, deployment);
        if(libs)
            result.push(...libs);
        return result;
    }
}  // end of link class

function GetClangDriver(platform, target)
{
    if(platform != "win32" && false)
    {
        // NB: on clang-for-vs/windows, we currently don't use the special 
        // clang-cl driver because it produces many more errors.
        // It's theorectical value is to hide/facilitate simple
        // interaction wrt windows crt and other runtime APIs.
        // Flipping the switch wreaks havoc.
        // To link against external static libs (eg OpenSSL)
        // we apparently need: -fms-runtime-lib=dll_dbg or dll
        // to guide its choice of c-runtime. dll->MSVCRT, dll_dbg->MSVCRTD
        // NB: currently any such policies must be implemented in cc and link.
        return {
            c: "clang-cl",
            cpp: "clang-cl",
            mm: "",
            link: "clang-cl",
        }[target];
    }
    else
    {
        if(target == "c")
            return "clang";
        else
            return "clang++"; // same for c, cpp and mm
    }
}

// also invoked by cc...
function GetClangFlags(platform, deployment, linktype) 
{
    const dofms = platform == "win32";
    if(!dofms) return null;

    let flags = [];
    if(deployment == "debug" || deployment == "releasesym")
        flags.push("-g");
    switch(deployment)
    {
    case "debug":
        flags.push("-fms-runtime-lib=dll_dbg");
        break;
    case "release":
        flags.push("-fms-runtime-lib=dll");
        break;
    }
    if(linktype)
    {
        // This represents the payback of a painful journey
        // to understand  how to use clang++ with MSV runtimes
        // without resorting to clang-cl magic.  
        // The gist: interacting with windows c-runtime for console
        // in debug and no-debug is hidden from view by visual studio.
        // To avoid switching to clang-cl, we implement the magic here
        // and below. // More on the explicit libs in getClangLibs.
        flags.push(["-Xlinker", "-NODEFAULTLIB"],
                   ["-Xlinker", "-IGNORE:4217"], //  Still useful for benign __declspec(dllimport) warnings
                  );
        if(linktype == "exe")
        {
            // dumpbin -headers shows that both appear to be equivalent
            // and also the default behavior of clang-linking.
            // flags.push(["-Xlinker", "-entry:mainCRTStartup"]); // <--- Explicitly define the entry point
            // flags.push(["-Xlinker", "-SUBSYSTEM:CONSOLE"]); // <--- Explicitly define the entry point
        }
    }
    return flags;
}

function getClangLibs(platform, deployment)
{
    if(platform != "win32") return null;
    return [
        "-lkernel32",
        "-lucrtd", 
        "-lvcruntimed", "-lmsvcprtd",
        "-lOldNames",  // For `atexit` from older C-compatible CRT
        "-lVCRuntime",  // # Redundant if using -lvcruntimed.lib, but sometimes needed for specific functions
        "-lLibCmt",     // Debug static CRT library - often pulls in `__GSHandlerCheck` etc.
        "-llegacy_stdio_definitions" // Some very old stdio functions might need this"
        // "-lmsvcrtd.lib"
    ].map((l) =>
    {
        if(deployment != "debug" && l.endsWith("d"))
            l = l.slice(0, -1); // strip the d
        return l +".lib";
    });
}


exports.Link = Link;
exports.GetClangDriver = GetClangDriver;
exports.GetClangFlags = GetClangFlags;