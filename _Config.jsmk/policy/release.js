var Policy = require("./default.js");

class ReleasePolicy extends Policy
{
    constructor(optConfig)
    {
        let config =
        {
            Deployment: "release",
        };
        Object.assign(config, optConfig);
        super(config);
    }
}

exports.Policy = ReleasePolicy;
