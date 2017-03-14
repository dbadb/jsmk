let winston = require('winston');
let path = require('path');
let util = require('./util');
let colors = require("colors");

exports.NewLogger = function(logdir)
{
    return new Logger(logdir);
}

let customLevels =
{
    ERROR: 0,
    WARNING: 1,
    NOTICE: 2,
    TIMESTAMP: 3,
    INFO: 4,
    DEBUG: 5,
};

let customColors =
{
    ERROR: 'red',
    WARNING: 'yellow',
    NOTICE: 'cyan',
    TIMESTAMP: 'green',
    INFO: 'white',
    DEBUG: 'white',
};

class Logger
{
    constructor(logdir)
    {
        winston.addColors(customColors);
        this.wlogger = new winston.Logger({levels:  customLevels});
        this.wlogger.add(winston.transports.Console,
                            {
                            timestamp: fmtTime,
                            level: 'INFO',
                            formatter: fmtMsgConsole
                            }
                         );
        util.MakeDirs(logdir); // NB: this may throw
        let logfile =  path.join(logdir, 'jsmk.log');
        this.wlogger.add(winston.transports.File,
                            {
                            timestamp: fmtTime,
                            level: 'DEBUG',
                            filename: path.join(logdir, 'jsmk.log')
                        }
                    );
    }

    Extend(obj)
    {
        // Install standard logging methods into obj.
        //      see https://github.com/winstonjs/winston/issues/790
        let logger = this.wlogger;
        ['log', 'profile', 'startTimer']
          .concat(Object.keys(logger.levels))
          .forEach(function (method) {
            obj[method] = function () {
                // console.log(method, arguments);
                return logger[method].apply(logger, arguments);
            };
        });
    }

    Query()
    {
        let options =
        {
            from: new Date - 5*60*1000, // last 5 minutes
            until: new Date,
            limit: 10,
            start: 0,
            order: 'desc',
            fields: ['timestamp', 'level', 'message']
        };
        console.log("Querying currently busted");
        this.wlogger.query(options,
            function(err, results)
            {
                if(err)
                {
                    console.log("logger", err);
                    throw(err);
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
                    if(e.level != 'TIMESTAMP')
                    {
                        console.log(e);
                    }
                }
            }
          );
    }
} // end Logger

/*-------------------------------------------------------------------*/
let timeFmtOpt =
{
  year: '2-digit', month: '2-digit', day:'2-digit',
  hour: '2-digit', minute: '2-digit',
  hour12: false
};

function pad(num, size)
{
    let s = "0" + num;
    return s.substr(s.length-size);
}

let lastTime = 0;
function fmtMsgConsole(options)
{
    let now = Date.now();
    let ts = "";
    if(options.level === "TIMESTAMP")
    {
        lastTime = now;
        return fmtLevel(options.level) + options.timestamp().green + " " + options.message;
    }
    else
    if(now-lastTime > 5000)
    {
        lastTime = now;
        ts = (fmtLevel("TIMESTAMP") + options.timestamp() + " ----------\n");
    }
    return ts + fmtLevel(options.level) + options.message;
}

function fmtLevel(l)
{
    let c = customColors[l];
    return ((l + "     ").slice(0, 10))[c];
}

function fmtTime()
{
    let date = new Date();
    // return d.toLocaleString('en-US', timeFmtOpt);
    let y = date.getFullYear();
    let m = 1+date.getMonth();
    let d = date.getDate();
    let h = date.getHours();
    let min = date.getMinutes();
    let sec = date.getSeconds();
    let newDate = pad(m, 2)+'/'+pad(d,2)+'/' + pad(y, 2) + ' ' +
                   pad(h, 2) + ':' + pad(min, 2) + pad(sec, 2);
    return newDate;
}
