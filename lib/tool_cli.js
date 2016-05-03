Tool = require("./Tool.js");

class Tool_Cli extends Tool
{
    constructor()
    {
        super.constructor(jsmk, name, role, settings);
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
