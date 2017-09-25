let ToolCli = jsmk.Require("tool_cli.js").Tool;
let Arch = jsmk.Require("toolset.js").Arch;

class Link extends ToolCli
{
    constructor(ts, vsvers)
    {
        let exefile = "link";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.VSToolsDir);
        if(!arg0) throw new Error("Can't resolve link "+
                                    ts.BuildVars.VSToolsDir);
        super(ts, `vs${vsvers}/link`, {
            Role:  ToolCli.Role.Link,
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "exe",
            Invocation: [arg0, "${FLAGS} -out:${DSTFILE} ${SRCFILES} "+
                               "${SEARCHPATHS} ${LIBS}"],
            Syntax:
            {
                Flag: "${VAL}",
                Lib: "${VAL}",
                Searchpath: "/LIBPATH:${VAL}",
            },
        });

        let machine;
        switch(ts.TargetArch)
        {
        case Arch.x86_32:
            machine="/machine:X86";
            break;
        case Arch.x86_64:
            machine="/machine:X64";
            break;
        case Arch.arm_32:
            machine="/machine:ARM";
            break;
        case Arch.arm_64:
            machine="/machine:ARM64";
            break;
        default:
            throw new Error("Link: unknown arch " + ts.TargetArch);
        }

        this.AddFlags([
            "/nologo",
            "/incremental",
            "/manifest:embed",
            "/dynamicbase",
            "/nxcompat",
            "/subsystem:console",
            "/tlbid:1",
            machine
        ]);

    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        switch(task.BuildVars.Deployment)
        {
        case "debug":
            task.AddFlags([
                "/debug",
            ]);
        case "release":
            task.AddFlags([

            ]);
            break;
        }
    }
}

exports.Link = Link;

/* https://msdn.microsoft.com/en-us/library/y0zzbyt4.aspx
usage: LINK [options] [files] [@commandfile]
   options:

      /ALIGN:#
      /ALLOWBIND[:NO]
      /ALLOWISOLATION[:NO]
      /APPCONTAINER[:NO]
      /ASSEMBLYDEBUG[:DISABLE]
      /ASSEMBLYLINKRESOURCE:filename
      /ASSEMBLYMODULE:filename
      /ASSEMBLYRESOURCE:filename[,[name][,PRIVATE]]
      /BASE:{address[,size]|@filename,key}
      /CLRIMAGETYPE:{IJW|PURE|SAFE|SAFE32BITPREFERRED}
      /CLRLOADEROPTIMIZATION:{MD|MDH|NONE|SD}
      /CLRSUPPORTLASTERROR[:{NO|SYSTEMDLL}]
      /CLRTHREADATTRIBUTE:{MTA|NONE|STA}
      /CLRUNMANAGEDCODECHECK[:NO]
      /DEBUG[:{FASTLINK|FULL|NONE}]
      /DEF:filename
      /DEFAULTLIB:library
      /DELAY:{NOBIND|UNLOAD}
      /DELAYLOAD:dll
      /DELAYSIGN[:NO]
      /DLL
      /DRIVER[:{UPONLY|WDM}]
      /DYNAMICBASE[:NO]
      /ENTRY:symbol
      /ERRORREPORT:{NONE|PROMPT|QUEUE|SEND}
      /EXPORT:symbol
      /EXPORTPADMIN[:size]
      /FASTGENPROFILE[:{COUNTER32|COUNTER64|EXACT|MEMMAX=#|MEMMIN=#|NOEXACT|
                        NOPATH|NOTRACKEH|PATH|PGD=filename|TRACKEH}]
      /FIXED[:NO]
      /FORCE[:{MULTIPLE|UNRESOLVED}]
      /FUNCTIONPADMIN[:size]
      /GUARD:{CF|NO}
      /GENPROFILE[:{COUNTER32|COUNTER64|EXACT|MEMMAX=#|MEMMIN=#|NOEXACT|
                    NOPATH|NOTRACKEH|PATH|PGD=filename|TRACKEH}]
      /HEAP:reserve[,commit]
      /HIGHENTROPYVA[:NO]
      /IDLOUT:filename
      /IGNORE:#
      /IGNOREIDL
      /IMPLIB:filename
      /INCLUDE:symbol
      /INCREMENTAL[:NO]
      /INTEGRITYCHECK
      /KERNEL
      /KEYCONTAINER:name
      /KEYFILE:filename
      /LARGEADDRESSAWARE[:NO]
      /LIBPATH:dir
      /LTCG[:{INCREMENTAL|NOSTATUS|OFF|STATUS|}]
      /MACHINE:{ARM|ARM64|EBC|X64|X86}
      /MANIFEST[:{EMBED[,ID=#]|NO}]
      /MANIFESTDEPENDENCY:manifest dependency
      /MANIFESTFILE:filename
      /MANIFESTINPUT:filename
      /MANIFESTUAC[:{NO|UAC fragment}]
      /MAP[:filename]
      /MAPINFO:{EXPORTS}
      /MERGE:from=to
      /MIDL:@commandfile
      /NOASSEMBLY
      /NODEFAULTLIB[:library]
      /NOENTRY
      /NOIMPLIB
      /NOLOGO
      /NXCOMPAT[:NO]
      /OPT:{ICF[=iterations]|LBR|NOICF|NOLBR|NOREF|REF}
      /ORDER:@filename
      /OUT:filename
      /PDB:filename
      /PDBSTRIPPED:filename
      /PROFILE
      /RELEASE
      /SAFESEH[:NO]
      /SECTION:name,[[!]{DEKPRSW}][,ALIGN=#]
      /STACK:reserve[,commit]
      /STUB:filename
      /SUBSYSTEM:{BOOT_APPLICATION|CONSOLE|EFI_APPLICATION|
                  EFI_BOOT_SERVICE_DRIVER|EFI_ROM|EFI_RUNTIME_DRIVER|
                  NATIVE|POSIX|WINDOWS|WINDOWSCE}[,#[.##]]
      /SWAPRUN:{CD|NET}
      /TLBID:#
      /TLBOUT:filename
      /TIME
      /TSAWARE[:NO]
      /USEPROFILE[:{AGGRESSIVE|PGD=filename}]
      /VERBOSE[:{CLR|ICF|INCR|LIB|REF|SAFESEH|UNUSEDLIBS}]
      /VERSION:#[.#]
      /WINMD[:{NO|ONLY}]
      /WINMDDELAYSIGN[:NO]
      /WINMDFILE:filename
      /WINMDKEYCONTAINER:name
      /WINMDKEYFILE:filename
      /WHOLEARCHIVE[:library]
      /WX[:NO]
*/
