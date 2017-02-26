
var path = require("path");
var util = require("./util.js");
var Settings = require("./settings.js").Settings;

var Semantics =
{
    OneToNone: "OneToNone",
    OneToOne: "OneToOne",
    ManyToOne: "ManyToOne",
    ManyToMany: "ManyToMany"
};

class Tool extends Settings
{
    constructor(toolset, name, config)
    {
        super();
        this.m_toolset = toolset;
        this.m_name = name;
        this.m_role = config.Role;
        this.m_semantics = config.Semantics;
        this.m_dstExt = config.DstExt;
        this.m_actionStage = config.ActionStage;
        this.m_syntax = config.Syntax;
    }

    // DstFilesFromSrc:
    //  given a list of fully-qualified src files, return a list
    //  of one or more dst file pathnames. Tools currently must follow
    //  many-to-many (eg compilation) and many-to-one pattern (eg link).
    DstFilesFromSrc(taskname, srcfiles, dstDir)
    {
        var dstfiles = [];
        switch(this.m_semantics)
        {
        case Semantics.ManyToOne:
            var dstfile = this.buildDstFilename(taskname, dstDir);
            dstfiles.append(dstfile);
            break;
        case Semantics.OneToOne:
        case Semantics.ManyToMany:
            var dstfiles = srcfiles.map( function(srcfile)
                    {
                        return this.buildDstFilename(srcfile, dstDir);
                    })
            break;
        case Semantics.OneToNone:
            break;
        default:
            throw(this.m_name + ": Unknown tool semantics: " + this.m_semantics);
        }
        return dstfiles;
    }

    BeginStage(stage, task)
    {
        /* not all tools need implement BeginStage */
    }

    // MakeWork returns an array of work objects
    MakeWork(stage, task)
    {
        throw("tools must implement MakeWork method");
    }

    EndStage(stage, task)
    {
        /* not all tools need implement EndStage */
    }

    // private -----------------------------------------------------------
    buildDstFileName(srcfile, dstDir)
    {
        var srcp = path.parse(srcfile);
        srcp.dir = dstDir;
        srcp.base = src.name + this.m_dstExt; // nb base is used by format...
        srcp.ext = this.m_dstExt;
        return util.FixupPath(srcp.format());
    }
}

// class variables, enums, etc
Tool.Semantics = Semantics;
exports.Tool = Tool;
