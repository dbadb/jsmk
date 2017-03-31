//
// A Framework representing the target OS system-level
// support.
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Arch = jsmk.Require("toolset").Arch;

class platform extends Framework
{
    constructor(name, version)
    {
        if(!version || version === "<host>")
        {
            let h = jsmk.GetHost();
            name = h.Platform;
            version = h.ReleaseFields.slice(0,2).join(".");
        }
        super(name, version);
        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        switch(name)
        {
            case "win32":
                this.m_link = this.linkWin32;
                this.m_compile = this.compileWin32;
                break;
            case "linux":
                this.m_link = this.linkLinux;
                this.m_compile = this.compileLinux;
                break;
            case "darwin":
                this.m_link = this.linkDarwin;
                this.m_compile = this.compileDarwin;
                break;
            default:
                throw new Error("Unimplemented platform " + name);
            // todo: add'l non-host platforms
            //  teensy
            //  cordova
            //  iPhone
            //  Android
        }
    }

    ConfigureTaskSettings(task)
    {
        let tool = task.GetTool();
        switch(tool.GetRole())
        {
        case Tool.Role.Compile:
            this.m_compile(task);
            break;
        case Tool.Role.Link:
            this.m_link(task);
            break;
        }
    }

    compileWin32(task)
    {
        task.Define({
            WIN32: null,
            _WIN32: null,
            _WINDOWS: null,
            _CRT_SECURE_NO_WARNINGS: null,
        });
    }

    linkWin32(task)
    {
        // NB: the toolset, itself, may have a set of platform behaviors
        if(false) {
            task.AddFlags([
                "-nodefaultlib",
            ]);
            task.AddLibraries([
                "kernel32.lib",
                "user32.lib",
                "gdi32.lib",
                "winspool.lib",
                "shell32.lib",
                "ole32.lib",
                "oleaut32.lib",
                "uuid.lib",
                "comdlg32.lib",
                "advapi32.lib",
            ]);
        }
        else {
            task.AddLibraries([
                "user32.lib",
            ]);

        }
    }

    compileLinux(task)
    {

    }
    linkLinux(task)
    {

    }

    compileDarwin(task)
    {

    }
    linkDarwin(task)
    {
    }
}

exports.Framework = platform;
