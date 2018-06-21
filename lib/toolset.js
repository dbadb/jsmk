/* global jsmk */
let SettingsContainer = require("./settingscontainer.js").SettingsContainer;

// toolset maps toolset-selector string to instantiated tool

let Arch =
{
    unspecified: "noarch",
    noarch: "noarch",
    x86_32: "x86_32",
    x86_64: "x86_64",
    arm_32: "arm_32",
    arm_64: "arm_64",
    // java,python,javascript not here since arch-independent
};

class Toolset extends SettingsContainer
{
    constructor(filenm, name, arch, platform)
    {
        super();
        this.m_toolmap = {};
        this.m_origin = filenm;

        // public names depended-upon by _Proj files.
        this.Name = name;
        this.TargetArch = Arch[arch];
        if(this.TargetArch == undefined)
        {
            jsmk.DEBUG("non-standard target arch " + arch);
            this.TargetArch = arch;
        }
        this.TargetPlatform = platform ? platform : jsmk.GetHost().Platform;
        this.ToolsetHandle = this.getHandle(); // must be computed 'late'
    }

    GetName()
    {
        return this.Name;
    }
 
    GetHandle()
    {
        return this.ToolsetHandle;
    }

    getHandle()
    {
        if(this.m_arch !== Arch.noarch)
        {
            let policy = jsmk.GetPolicy();
            let tmplt = policy.ToolsetHandleTmplt;
            let self = this;
            return jsmk.Interpolate(tmplt, function(key) {
                switch(key)
                {
                    case "TargetPlatform":
                        return self.TargetPlatform;
                    case "TargetArch":
                        return self.TargetArch;
                    case "ToolsetName":
                    case "Name":
                        return self.Name;
                    default:
                        return key;
                }
            });
        }
        else
            return this.ToolsetName;
    }

    MergeToolMap(map)
    {
        this.mergeMaps(this.m_toolmap, map);
    }

    GetTool(rule)
    {
        return this.m_toolmap[rule];
    }

    ConfigureTaskSettings(settings)
    {
        jsmk.DEBUG("toolset:ConfigureTaskSettings is unimplemented (by subclass)");
    }
}

Toolset.Arch = Arch;
exports.Toolset = Toolset;
exports.Arch = Arch;
