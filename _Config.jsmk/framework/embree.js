//
// A Framework for Intel's thread-building-blocks (TBB) c++ library
//
//  currently we require that the tbb dll's be in path
//  (the free distro doesn't appear to have a static link option)
//
let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;

class embree extends Framework
{
    constructor(name, version)
    {
        if(!version) version = "default";
        super(name, version);
        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;
        let eArch;
        switch(this.m_arch)
        {
        case Toolset.Arch.x86_64:
            eArch = "x64";
            break;
        default:
            break;
        }
        if(!eArch)
            throw new Error("embree toolset arch not supported:" + this.m_arch);

        switch(this.m_version)
        {
        case "default":
        case "2.15":
            this.m_rootDir = `D:/Program Files/Intel/Embree v2.15.0 ${eArch}`;
            break;
        default:
            throw new Exception("embree frameork version botch: ", version);
        }

        this.m_incDir = jsmk.path.join(this.m_rootDir, "include");
        this.m_libDir = jsmk.path.join(this.m_rootDir, "bin");
    }

    ConfigureTaskSettings(task)
    {
        let tool = task.GetTool();
        switch(tool.GetRole())
        {
        case Tool.Role.Compile:
            task.AddSearchpaths("Compile", [this.m_incDir]);
            break;
        case Tool.Role.Link:
            task.AddSearchpaths("Link", [this.m_libDir]);
            let libs= ["embree.dll"]; // also? freeglut, tbband tbbmalloc?
            tool.AddLibraries(libs);
            break;
        }
    }
}

exports.Framework = embree;
