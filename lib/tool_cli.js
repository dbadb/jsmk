var Tool = require("./tool.js").Tool;

class Tool_Cli extends Tool
{
    constructor(toolset, name, config)
    {
        super(toolset, name, config);
    }

    DstFilesFromSrc(taskname, srcfiles, dstDir)
    {

    }

    BeginStage(stage, task)
    {
    }

    // MakeWork returns an array of work objects
    MakeWork(stage, task)
    {
        throw("tools must implement MakeWork method");
    }

    EndStage(stage, task)
    {
    }
}

exports.Tool = Tool_Cli;
