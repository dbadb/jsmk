
class Project
{
    constructor(projectFile)
    {

    }

};

exports.NewProjectTree = function(policy) // ---- factory -------------
{
    return new Project(policy.RootPath);
}
