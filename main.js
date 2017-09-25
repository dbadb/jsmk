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
        if(!e)
            e = new Error("DoBuilds reject");
        if(typeof e === "string")
            jsmk.ERROR("jsmk " + e);
        else
            jsmk.ERROR("jsmk " + e.stack);
        err = e;
    })
    .finally(() => {
        jsmk.EndSession(err);
    });
