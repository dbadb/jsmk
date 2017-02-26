var Policy = require("./default.js");

class ReleasePolicy extends Policy
{
    constructor()
    {
        let config = {
            Deployment: "release",
        }
        super(config);
    }
}

exports.Policy = ReleasePolicy;
