var Tool = require("./tool.js").Tool;
var childProcess = require("child_process");

class Tool_Cli extends Tool
{
    constructor(toolset, name, config)
    {
        super(toolset, name, config);
    }

    BeginStage(stage, task)
    {
    }

    *GenerateWork(stage, inputs, outputs)
    {

    }

    EndStage(stage, task)
    {
    }
}

exports.Tool = Tool_Cli;
