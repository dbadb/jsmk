var SettingsContainer = require("./settingscontainer.js").SettingsContainer

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
    constructor(filenm, name, arch)
    {
        super();
        this.m_origin = filenm;
        this.m_arch = Arch[arch];
        this.m_name = name;
        this.m_toolmap = {};
    }

    GetName()
    {
        if(this.m_arch !== Arch.noarch)
            return `${this.m_name}_${this.m_arch}`;
        else
            return this.m_name;
    }

    GetNameNoArch()
    {
        return this.m_name;
    }

    GetArch()
    {
        return this.m_arch;
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
    }
}

Toolset.Arch = Arch;
exports.Toolset = Toolset;
