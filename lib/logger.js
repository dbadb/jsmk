var winston = require('winston');
var path = require('path');

var timeFmtOpt =  {
  year: '2-digit', month: '2-digit', day:'2-digit',
  hour: '2-digit', minute: '2-digit',
  hour12: false
};

function fmtTime() {
    var d = new Date();
    return d.toLocaleString('en-US', timeFmtOpt);
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
        WARNING: 'orange',
        ERROR: 'red'
    }
};

exports.NewLogger = function(logdir)
{
    var l = new winston.Logger({levels:  customLevels.levels});
    winston.addColors(customLevels.colors);
    l.add(winston.transports.Console,
                        {
                        timestamp: fmtTime,
                        level: 'INFO',
                        colorize: true,
                        }
                     );
    l.add(winston.transports.File, 
                        {
                        timestamp: fmtTime,
                        level: 'DEBUG',
                        filename: path.join(logdir, 'jsmk.log')
                        }
                    );

    return l;
}
