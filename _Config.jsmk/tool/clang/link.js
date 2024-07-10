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
        let platform = jsmk.GetHost().Platform;
        let exe = "clang++";
        let exepath = jsmk.path.join(ts.BuildVars.CLANG_BIN, exe);
        let arg0 = jsmk.path.resolveExeFile(exepath);
        if(!arg0) throw new Error(`Can't resolve ${exe} ${ts.BuildVar.CLANG_BIN}`);

        super(ts, "clang/link",
            {
                Role: ToolCli.Role.Link,
                Semantics: ToolCli.Semantics.ManyToOne,
                DstExt: buildso ? "dylib" : platform=="win32" ? "exe" : "",
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
        let flags = {
            darwin: [
                ["-isysroot", "${MACOSX_SDK}"],     
                "-mmacosx-version-min=13.0", 
            ],
            win32: [
                "-g", // produces .pdb files when used via visual studio
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
    }
}  // end of link

exports.Link = Link;
