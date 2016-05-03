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
        this.wlogger = new winston.Logger({levels:  customLevels.levels});
        winston.addColors(customLevels.colors);
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
        this.wlogger.extend(obj);
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
        DEBUG: 0,
        INFO: 1,
        TIMESTAMP: 2,
        NOTICE: 3,
        WARNING: 4,
        ERROR: 5
    },
    colors: {
        DEBUG: 'blue',
        INFO: 'blue',
        TIMESTAMP: 'green',
        NOTICE: 'cyan',
        WARNING: 'red', // NB: orange isn't a valid color
        ERROR: 'red'
    }
};
