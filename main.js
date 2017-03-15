global.jsmk = require('./lib/jsmk.js').NewJsmk();

try
{
    jsmk.BeginSession();
}
catch(e)
{
    jsmk.ERROR("bootstrap:" + e.stack ? e.stack : e);
    jsmk.EndSession(e);
    process.exit(-1);
}

let err = null;
jsmk.DoBuilds()
    .then(()=>{
        jsmk.NOTICE("done with builds");
    })
    .catch((e)=>{
        err = e;
        jsmk.ERROR("main: " + e);
    })
    .finally(() => {
        jsmk.EndSession(err);
    });
