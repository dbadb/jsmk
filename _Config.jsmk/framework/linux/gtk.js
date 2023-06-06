//
// A Framework for linux gtk library https://docs.gtk.org/gtk3/compiling.html
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;
let Platform = jsmk.GetHost().Platform;
let FrameworkDir = jsmk.GetPolicy().LocalFrameworkDir;

class Gtk extends Framework
{
    // user's Project requests access to a framework by name and version.  
    constructor(name, version)
    {
        super(name, version);
        if(!version.match(/^(3.0|default)/))
            throw new Error(`Gtk unsupported version: ${version} (3.0 supported)`);

        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        switch(Platform)
        {
        case "win32":
        case "darwin":
            throw new Error("Gtk framework not supported on " + Platform);
            break;
        case "linux":
            // pkg-config --cflags gtk+-3.0
            // pkg-config --libs gtk+-3.0
            this.m_incdirs = [
                "/usr/include/gtk-3.0", "/usr/include/at-spi2-atk/2.0",
                "/usr/include/at-spi-2.0", "/usr/include/dbus-1.0",
                "/usr/lib/x86_64-linux-gnu/dbus-1.0/include", 
                "/usr/include/gtk-3.0", "/usr/include/gio-unix-2.0", 
                "/usr/include/cairo", "/usr/include/pango-1.0",
                "/usr/include/fribidi", "/usr/include/harfbuzz", 
                "/usr/include/atk-1.0", "/usr/include/cairo", 
                "/usr/include/pixman-1", "/usr/include/uuid", 
                "/usr/include/freetype2", "/usr/include/libpng16", 
                "/usr/include/gdk-pixbuf-2.0", "/usr/include/libmount", 
                "/usr/include/blkid", "/usr/include/glib-2.0", 
                "/usr/lib/x86_64-linux-gnu/glib-2.0/include",
            ];
            this.m_libs = [
                "gtk-3", "gdk-3", "pangocairo-1.0", "pango-1.0", "harfbuzz", 
                "atk-1.0", "cairo-gobject", "cairo", 
                "gdk_pixbuf-2.0", "gio-2.0", "gobject-2.0", "glib-2.0"
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

exports.Framework = Gtk;
