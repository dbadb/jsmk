var winston = require('winston');
var path = require('path');
var util = require('./util');

exports.NewLogger = function(logdir)
{
    return new Logger(logdir);
}

class Logger
{
    constructor(logdir)
    {
        winston.addColors(customLevels.colors);
        this.wlogger = new winston.Logger({levels:  customLevels.levels});
        this.wlogger.add(winston.transports.Console,
                            {
                            timestamp: fmtTime,
                            level: 'INFO',
                            colorize: true,
                            }
                         );
        util.MakeDirs(logdir); // NB: this may throw
        var logfile =  path.join(logdir, 'jsmk.log');
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
        var logger = this.wlogger;
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
        var options =
        {
            from: new Date - 5*60*1000, // last 5 minutes
            until: new Date,
            limit: 10,
            start: 0,
            order: 'desc',
            fields: ['timestamp', 'level', 'message']
        };
        this.wlogger.query(options,
            function(err, results)
            {
                if(err) throw(err);
                var errlist  = results.file;
                if (errlist.length == 0)
                    console.log("no log traffic in the last 5 m\n");
                else
                    console.log("recent log traffic:\n");
                for(var i=0;i<errlist.length;i++)
                {
                    var e = errlist[i];
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
var timeFmtOpt =  {
  year: '2-digit', month: '2-digit', day:'2-digit',
  hour: '2-digit', minute: '2-digit',
  hour12: false
};

function pad(num, size) {
    var s = "0" + num;
    return s.substr(s.length-size);
}

function fmtTime() {
    var date = new Date();
    // return d.toLocaleString('en-US', timeFmtOpt);
    var y = date.getFullYear();
    var m = 1+date.getMonth();
    var d = date.getDate();
    var h = date.getHours();
    var min = date.getMinutes();
    return pad(m, 2)+'/'+pad(d,2)+'/' + pad(y, 2) + ' ' +
           pad(h, 2) + ':' + pad(min, 2);
}

var customLevels =
{
    levels: {
        ERROR: 0,
        WARNING: 1,
        NOTICE: 2,
        TIMESTAMP: 3,
        INFO: 4,
        DEBUG: 5,
    },
    colors: {
        ERROR: 'red',
        WARNING: 'yellow',
        NOTICE: 'cyan',
        TIMESTAMP: 'green',
        INFO: 'blue',
        DEBUG: 'blue',
    }
};
