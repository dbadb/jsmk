/* global jsmk */
// toolset/foundation.js:
//      - establishes cross-toolset behavior for a wide range of "rules"
//      - since we're not a concrete toolset, we don't export GetToolsets
//

let Toolset = jsmk.Require("toolset.js").Toolset;
let CopyFiles = jsmk.LoadConfig("tool/copyfiles.js").CopyFiles;
let Printenv = jsmk.LoadConfig("tool/printenv.js").Printenv;
let ToolCli = jsmk.Require("tool_cli.js").Tool;
let Tool = jsmk.Require("tool.js").Tool;

class Foundation extends Toolset
{
    constructor(filename, tsname, arch, platform)
    {
        super(filename, tsname, arch, platform);

        // no settings in foundation?

        this.MergeToolMap( {
            copyfiles:  new CopyFiles(this, "<novers>", {
                            ActionStage: "build"
                        }),
            install:    new CopyFiles(this, "<novers>", {
                            ActionStage: "install"
                        }),
            printenv: new Printenv(this),

            // general development -------------------
            npmcmd: new ToolCli(this, "npmcmd", 
                        {
                            Role: "Compile",
                            ActionStage: "build",
                            Invocation: 
                            [
                                (process.platform == "win32") ? "npm.cmd" : "npm",
                                "${ARGUMENTS}"
                            ],
                            Semantics: Tool.Semantics.CustomTrigger
                        }),
            buildscript: new ToolCli(this, "buildscript", 
                        {
                            Role: "Compile",
                            ActionStage: "build",
                            Invocation: ["node", "${ARGUMENTS}"],
                            Semantics: Tool.Semantics.CustomTrigger
                        }),
            preinstallscript: new ToolCli(this, "preinstallscript", 
                        {
                            Role: "Archive",
                            ActionStage: "preinstall",
                            Invocation: ["node", "${ARGUMENTS}"],
                            Semantics: Tool.Semantics.CustomTrigger
                        }),
            installscript: new ToolCli(this, "installscript", 
                        {
                            Role: "Archive",
                            ActionStage: "install",
                            Invocation: ["node", "${ARGUMENTS}"],
                            Semantics: Tool.Semantics.CustomTrigger
                        }),
            packagescript: new ToolCli(this, "packagescript", 
                        {
                            Role: "Package",
                            ActionStage: "package",
                            Invocation: ["node", "${ARGUMENTS}"],
                            Semantics: Tool.Semantics.CustomTrigger
                        }),

            // for javascript development -------------------
            ".js->.js.min": null, // aka uglify

            // for Android ----------------------------------

            // for iPhone -----------------------------------

            // for cpp dev (platform+toolset specific) ------
            "c->o":     undefined,
            "c->a":     undefined,
            "c.o->exe": undefined,
            "cpp->o":   undefined,
            "cpp->a":   undefined,
            "cpp.o->exe": undefined,
            "link":     undefined,

            // shader development ---------------------------
            "osl->oso": undefined, // "oslcompiler"
            "sl->slo": undefined   // "rslcompiler"
        } );
    }
};

exports.Foundation = Foundation;
