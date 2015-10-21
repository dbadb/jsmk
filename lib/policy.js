var path = require("path");
var util = require("./util.js");

var s_standardStages = {
            nuke: 0,
            sync: 1,
            clean: 2,
            build: 3,
            unittest: 4,
            install: 5,
            "package": 6,
            reposit: 7,
            test: 8,
            benchmark: 9
                    };

var s_defaultBuildTmplt = "${OS}_${ARCH}_${TS}_${DEPLOY}_${FLAVOR}_${BUILDID}";

exports.NewBuildPolicy = function(host, user) // ---- factory -------------
{
    return new BuildPolicy(host, user);
}

function BuildPolicy(host, user) // ---- constructor ----
{
    this.Perform = true;
    this.Threads = 0;
    this.Stages = ["build", "install"];
    this.Deployment = "debug";
    this.DeploymentMap = {}; // usually from policy file.
    this.Flavor = "vanilla";
    this.BuildID = "head";
    this.BuildStr = {}; // keyed by toolset name
    this.BuildTmplt = s_defaultBuildTmplt;
}

BuildPolicy.prototype = 
{
    Init : function(configdir, policy, stages, perform, threads)
    {
        this.loadPolicy(configdir, policy); // should occur first (may throw)
        if(!stages && stages.length > 0)
        {
            this.setStages(stages);
        }
    },

    GetBuildStr : function(toolsetnm)
    {
        // for now we hard-code the template.. javascript's string templates
        // explicitly discourage passed-in string templates.
        if(!this.BuildStr[toolsetnm])
        {
            // win32_x64_toolset_debug_flavor_buildid

            this.BuildStr[toolsetnm] = util.Interpolate(this.BuildTmplt,
                                                        smap);
        }
        return this.BuildStr[toolsetnm];
    },

    setStages : function(stagestr) // -- method --
    {
        var inlist = stagestr.split(',');
        var slist = inlist.sort(function(a, b) {
                        var apri = s_standardStages[a];
                        var bpri = s_standardStages[b];
                        if (apri === undefined  || bpri === undefined) { 
                            throw("invalid stage in stagelist: " + slist);
                        } else {
                            return (apri < bpri) ? -1 : 1;
                        }
                    });
        this.Stages = slist;
    },

    loadPolicy : function(dir, nm)
    {
        // policy files are expected  in "dir/policy/nm.js"
        var file = path.join(dir, "policy", nm + ".js");
        
    },
};

