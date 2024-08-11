let Framework = jsmk.Require("framework").Framework;
let Tool = jsmk.Require("tool").Tool;
let Toolset = jsmk.Require("toolset").Toolset;
let Platform = jsmk.GetHost().Platform;
let FrameworkDirs = jsmk.GetPolicy().LocalFrameworkDirs;

/* eigen is a header-only c++ library with semantic versioning.
 * 7/2024: version 3.4.0
 */
class eigen extends Framework
{
    constructor(name, version="default")
    {
        super(name, version);
        this.m_toolset = jsmk.GetActiveToolset();
        this.m_arch = this.m_toolset.TargetArch;

        // user includes files via: #include <Eigen/Core>
        // so our only job is to point inside the required distribution
        let vers = version == "default" ? "3.4.0" : version;
        for(let fw of FrameworkDirs)
        {
            let incdir = jsmk.path.join(fw, `eigen-${vers}`);
            if(jsmk.path.existsSync(incdir))
            {
                this.m_incDir = incdir;
                break;
            }
        }
    }

    ConfigureTaskSettings(task) /* the preferred mode of operation */
    {
        let tool = task.GetTool();
        let r = tool.GetRole();
        switch(r)
        {
        case Tool.Role.Compile:
            if(this.m_incDir)
                task.AddSearchpaths(r, [this.m_incDir]);
            break;
        case Tool.Role.Link:
        case Tool.Role.ArchiveDynamic:
            break;
        }
    }
}

exports.Framework = eigen;
