//
// A Framework for linux gtk library https://docs.gtk.org/gtk3/compiling.html
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;
let Platform = jsmk.GetHost().Platform;
let FrameworkDir = jsmk.GetPolicy().LocalFrameworkDir;

class Webview extends Framework
{
    // user's Project requests access to a framework by name and version.  
    constructor(name, version)
    {
        super(name, version);
        if(!version.match(/^(default)/))
            throw new Error(`Web unsupported version: ${version} (default supported)`);

        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        switch(Platform)
        {
        case "win32":
        case "darwin":
            throw new Error("Webview framework not implemented on " + Platform);
            break;
        case "linux":
            // pkg-config --cflags webkit2gtk-4.0
            this.m_incdirs = [
                "/usr/include/webkitgtk-4.0", "/usr/include/libsoup-2.4"
            ];
            // pkg-config --libs webkit2gtk-4.0
            this.m_libs = [
                "webkit2gtk-4.0", "soup-2.4", 
                "javascriptcoregtk-4.0",
            ]
            break;
        default:
            throw new Error("Gtk implemented platform " + Platform);
        }
    }

    ConfigureTaskSettings(task) /* the preferred mode of operation */
    {
        let tool = task.GetTool();
        let r = tool.GetRole();
        switch(r)
        {
        case Tool.Role.Compile:
            task.AddSearchpaths(r, this.m_incdirs);
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            task.AddLibs(this.m_libs);
            break;
        }
    }
}

exports.Framework = Webview;
