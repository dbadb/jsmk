/* global jsmk */
const { LEVEL, MESSAGE, SPLAT } = require('triple-beam');
let winston = require("winston");
// let rot = require("winston-daily-rotate-file");
let path = require("path");
let util = require("./util");

exports.NewLogger = function(logdir)
{
    return new Logger(logdir);
};

let config = {
    levels: // similar to npm levels
    {
        ERROR: 0,    // error
        WARNING: 1,  // warn
        NOTICE: 2,   // info
        TIME: 3,     // http (??)
        INFO: 4,     // verbose
        DEBUG: 5,    // debug
        TRACE: 6,    // silly
    },

    colors:
    {
        ERROR: "red",
        WARNING: "lightred",
        NOTICE: "cyan",
        TIME: "lightgreen",
        INFO: "lightblue",
        DEBUG: "lightmagenta",
        TRACE: "lightgray",
    },
};

class Logger
{
    constructor(logdir)
    {
        util.PathFuncs.makedirs(logdir); // NB: this may throw
        this.consoleFormatter = new CustomFormatter({colorize: true, logger: this})
        this.fileFormatter = new CustomFormatter({colorize: false , logger: this})
        this.console = new winston.transports.Console(
                        {
                            level: "INFO", // overridden below
                            format: this.consoleFormatter,
                            // format: consoleFormatter,
                            // formatter: fmtMsgConsole.bind(this)
                            // format: winston.format.combine(
                            //     // winston.format.colorize({all: true}),
                            //     winston.format.simple()
                            // )
                        });
        
        let now = new Date();
        let day = now.getDate(); // 
        this.logfile = new winston.transports.File(
                        {
                            eol: "\n",
                            level: "DEBUG",
                            format: this.fileFormatter,
                            filename: path.join(logdir, `jsmk-${day}.log`),
                            maxFiles: 2,
                            maxsize: 10*1024*1024, // 10MB
                        });
        this.wlogger = winston.createLogger({
            levels: config.levels,
            transports: [ this.console, this.logfile ],
        });
    }

    SetLevel(lev, msgFilter)
    {
        this.console.level  = lev;
        this.consoleFormatter.msgFilter = msgFilter;
    }

    GetLevel()
    {
        return this.console.level;
    }

    CheckLogLevel(str)
    {
        let l = customLevels[str];
        let x = customLevels[this.console.level];
        return l <= x;
    }

    Extend(obj)
    {
        // Install standard logging methods into obj.
        //      see https://github.com/winstonjs/winston/issues/790
        let logger = this.wlogger;
        ["log", "profile", "startTimer"]
          .concat(Object.keys(logger.levels))
          .forEach(function (method) {
            obj[method] = function () {
                // console.log(method, arguments);
                return logger[method].apply(logger, arguments);
            };
        });

        obj.CheckLogLevel = this.CheckLogLevel.bind(this);
    }

    Query()
    {
        let options =
        {
            from: new Date - 5*60*1000, // last 5 minutes
            until: new Date,
            limit: 10,
            start: 0,
            order: "desc",
            fields: ["timestamp", "level", "message"]
        };
        console.log("Querying currently busted");
        this.wlogger.query(options,
            function(err, results)
            {
                if(err)
                {
                    console.log("logger", err);
                    throw new Error(err);
                }
                else {
                    console.log("logger",  results);
                }
                let errlist  = results.file;
                if (errlist.length == 0)
                    console.log("no log traffic in the last 5 m\n");
                else
                    console.log("recent log traffic:\n");
                for(let i=0;i<errlist.length;i++)
                {
                    let e = errlist[i];
                    if(e.level != "TIME")
                    {
                        console.log(e);
                    }
                }
            }
        );
    }
} // end Logger

/*-------------------------------------------------------------------*/
class CustomFormatter 
{
    constructor(cfg) 
    {
        this.cfg = cfg;
        this.lastTime = 0;
        this.msgFilter = null;
    }

    transform(info) 
    {
        // console.log("---------------- ", JSON.stringify(info))
        let m = Symbol.for("message");
        info[m] = this.fmtMsg(info)
        return info;
    }

    fmtMsg(info)
    {
        if(!info.message)
        {
            // console.warn(`unexpected message ${JSON.stringify(info)}`);
            return;
        }
        let msg = this.colorizeMsg(info.message);
        let now = Date.now();
        let ts = "";
        if(info.level === "TIME")
        {
            this.lastTime = now;
            return this.fmtLevel(info.level) +
                   this.applyColor(config.colors.TIME, this.fmtTime()) +
                   " " + msg;
        }
        else
        if(now-this.lastTime > 5000)
        {
            this.lastTime = now;
            ts = (this.fmtLevel("TIME") + this.fmtTime() + " ----------\n");
        }
        if(this.msgFilter)
            msg = this.msgFilter(msg)
        return ts + this.fmtLevel(info.level) + msg;
    }

    colorizeMsg(msg)
    {
        // if a message includes "<LEVEL>some text</LEVEL>"
        let r = /<[A-Z]*>.*<\/[A-Z]*>/g;
        return msg.replace(r, (match) =>
        {
            let f = match.indexOf(">");
            let l = match.lastIndexOf("<");
            let level = match.slice(1, f);
            let inner = match.slice(f+1, l);
            let color = config.colors[level];
            if(!color)
                return match;
            else
            if(this.cfg.colorize)
            {
                return this.applyColor(color, inner);
            }
            else
            {
                return inner;
            }
        });
    }

    applyColor(c, msg)
    {
        if(this.cfg.colorize)
            return jsmk.colors.apply(c, msg);
        else
            return msg;
    }

    fmtLevel(l)
    {
        let lpad = ((l + "      ").slice(0, 8));
        return this.applyColor(config.colors[l], lpad);
    }

    fmtTime()
    {
        let pad = function(num, size)
        {
            let s = "0" + num;
            return s.substring(s.length-size);
        }
        let date = new Date();
        let y = date.getFullYear();
        let m = 1+date.getMonth();
        let d = date.getDate();
        let h = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();
        let newDate = pad(m, 2)+"/"+pad(d,2)+"/" + pad(y, 2) + " " +
                    pad(h, 2) + ":" + pad(min, 2) + "." + pad(sec, 2);
        return newDate;
    }
}
