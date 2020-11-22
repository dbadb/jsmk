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
    // arm is confusing:
    // https://community.arm.com/developer/ip-products/processors/f/cortex-m-forum/5814/what-is-difference-between-arm7-and-arm-cortex-m-series
    // Arm7 (1994-2001) uses the Armv4T architecture, which supports two instruction sets: The old Arm instruction set and Thumb
    // Arm Cortex-M0 uses the Armv6-M (only supports 16-bit thumb instructions).
    // Arm Cortex-M3 and later uses the Armv7-M which supports the Thumb2 instruction set (16-bit + 32-bit instructions).

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
        this.TargetPlatform = platform?platform:jsmk.GetHost().TargetPlatform;
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
