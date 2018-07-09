/* global jsmk */

let ToolCli = jsmk.Require("tool_cli.js").Tool;
let Arch = jsmk.Require("toolset.js").Arch;

/*
Usage:  rc [options] .RC input file
Switches:
   /r       Emit .RES file (optional)
   /v       Verbose (print progress messages)
   /d       Define a symbol
   /u       Undefine a symbol
   /fo      Rename .RES file
   /l       Specify default language using language identifier
   /ln      Specify default language using language name
   /i       Add a path for INCLUDE searches
   /x       Ignore INCLUDE environment variable
   /c       Define a code page used by NLS conversion
   /w       Warn on Invalid codepage in .rc (default is an error)
   /y       Don't warn if there are duplicate control ID's
   /n       Append null's to all strings in the string tables
   /fm      Localizable resource only dll file name
   /q       RC Configuration file for the resource only DLL
   /g       Specify the ultimate fallback language using language identifier
   /gn      Specify the ultimate fallback language using language name
   /g1      Specify if version only MUI file can be created
   /g2      Specify the custom file version for checksum in MUI creation
   /nologo  Suppress startup logo
   /sl      Specify the resource string length limit in percentage
Flags may be either upper or lower case
*/

// RC produces .res files which can be included in msvc's link line
class RC extends ToolCli
{
    constructor(ts, vsvers)
    {
        let exefile = "rc";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.VSSDKToolsDir);
        if(!arg0) throw new Error("Can't resolve rc.exe "+ ts.BuildVars.VSSDKToolsDir);
        super(ts, `vs${vsvers}/rc`, {
            Role:  ToolCli.Role.Compile,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "res",
            Invocation: [arg0, "-fo ${DSTFILE} ${FLAGS} ${SRCFILES}"],
            Syntax: {
                Flag: "${VAL}"
            }
        });

        this.AddFlags(this.GetRole(), [
            "-nologo",
            "-l409", // english language
            // "-v"
        ]);
    }
}

exports.RC = RC;
