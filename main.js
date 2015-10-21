var jmod = require('./lib/jsmk.js');
var err = false;

global.jsmk = jmod.NewJsmk();

try {
    jsmk.BeginSession();
}

catch (ex) {
    if (ex)
    {
        jsmk.ERROR(ex);
        err = true;
    }
}

finally  {
    jsmk.EndSession(err);
}

