
path = require("path");
util = require("./util.js");

// nb: to compose settings
//  Object.assign(target, obj1, obj2, ...) (ecma6)
//
class Tool
{
    constructor(jsmk, name, role, settings)
    {
        this.Jsmk = jsmk;
        this.Name = name;
        this.Role = role;
        this.Semantics = settings.Semantics;
        this.DstExt = settings.DstExt;
        this.ActionStage = settings.ActionStage;
        this.Syntax = settings.Syntax;
        this.Settings = Settings;
        this.Env = [];
    }

    // DstFilesFromSrc:
    //  given a list of fully-qualified src files, return a list
    //  of one or more dst file pathnames. Tools currently must follow
    //  many-to-many (eg compilation) and many-to-one pattern (eg link).
    DstFilesFromSrc(taskname, srcfiles, dstDir)
    {
        var dstfiles = [];
        switch(this.Semantics)
        {
        case "OneToNone";
            var dstfile = this.buildDstFilename(taskname, dstDir);
            dstfiles.append(dstfile);
            break;
        case "OneToOne":
        case "ManyToMany":
            var dstfiles = srcfiles.map( function(srcfile)
                    {
                        return this.buildDstFilename(srcfile, dstDir);
                    })
            break;
        case "ManyToOne":
            break;
        default:
            throw(this.Name + ": Unknown tool semantics: " + this.Semantics);
        }
        return dstfiles;
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

    // private -----------------------------------------------------------
    buildDstFileName(srcfile, dstDir)
    {
        var srcp = path.parse(srcfile);
        srcp.dir = dstDir;
        srcp.base = src.name + this.DstExt; // nb base is used by format...
        srcp.ext = this.DstExt;
        return util.FixupPath(srcp.format());
    }
}

exports = Tool;
