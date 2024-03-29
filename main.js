/* global jsmk */
global.jsmk = require("./lib/jsmk.js").NewJsmk();

/*
global.oldwarn = console.warn;
console.warn = function()
{
    jsmk.WARNING("someone writing to console: " + JSON.stringify(arguments));
}

console.log = function()
{
    jsmk.WARNING("someone writing to console: " + JSON.stringify(arguments));
}
*/

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
jsmk.TRACE("DoBuilds");
jsmk.DoBuilds()
    .then(()=>{
        jsmk.NOTICE("-- Done ----");
    })
    .catch((e)=>{
        if(e)
        {
            if(typeof e === "string")
                jsmk.ERROR("jsmk " + e);
            else
                jsmk.ERROR("jsmk " + e.stack);
            err = e;
        }
        else
            err = 1;
    })
    .finally(() => {
        jsmk.EndSession(err);
    });
