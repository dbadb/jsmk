/* global jsmk */
var Policy = jsmk.Require("policy.js").Policy;

class DefaultPolicy extends Policy
{
    constructor(optConfig)
    {
        let config =
        {
            // add more Policy overrides here or let the users
            // do so in ~/.jsmk/policy
            Deployment: "debug",
        };
        Object.assign(config, optConfig);
        super(config);
    }
}

exports.Policy = DefaultPolicy;
