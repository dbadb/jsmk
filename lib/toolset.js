
exports.NewToolset = function (filenm, name)
{
    return new Toolset(filenm, name);
}

class Toolset
{
    constructor(filenm, name)
    {
        this.Origin = filenm;
        this.Name = name;
        this.prototype = require(filenm).Toolset;
    }
}
