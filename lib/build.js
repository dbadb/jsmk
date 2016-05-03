exports.NewBuild = function() // ---- factory ---------------------------
{
    return new Build();
}

/*---------------------------------------------------------------------*/
class Build
{
    constructor (policy, toolsetnm)  // ---- constructor -----
    {
        this.m_toolset = toolsetnm;
        this.m_policy = policy;
        this.m_buildStr = m_policy.GetBuildStr(toolsetnm);
    }
    
    GetBuildStr(toolsetnm)
    {
        return this.m_buildspec.Get(this.m_host, toolsetnm);
    }
}
