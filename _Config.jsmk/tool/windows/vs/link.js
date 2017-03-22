let ToolCli = jsmk.Require("tool_cli.js").Tool;

class Link extends ToolCli
{
    constructor(ts, vsvers)
    {
        let exefile = "link";
        let arg0 = jsmk.path.resolveExeFile(exefile, ts.BuildVars.VSToolsDir);
        if(!arg0) throw new Error("Can't resolve link "+
                                    ts.BuildVars.VSToolsDir);
        super(ts, `vs${vsvers}/link`, {
            Role:  "linker/c",
            ActionStage: "build",
            Semantics: ToolCli.Semantics.ManyToOne,
            DstExt: "exe",
            Invocation: [arg0, "${FLAGS} -out:${DSTFILE} ${SRCFILES}"],
            Syntax:
            {
                Flag: "${VAL}"
            },
        });

        this.AddFlags([
            "-nologo",
            "-incremental:no",
            "-manifest"
        ]);
    }

    ConfigureTaskSettings(task)
    {
        super.ConfigureTaskSettings(task);
        switch(task.BuildVars.Deployment)
        {
        case "debug":
            task.AddFlags([

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