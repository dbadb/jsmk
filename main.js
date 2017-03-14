var err = false;
global.jsmk = require('./lib/jsmk.js').NewJsmk();

jsmk.BeginSession();
jsmk.DoBuilds()
    .catch( (err) =>
    {
        jsmk.ERROR(err + " " + jsmk.StackTrace());
    })
    .finally( () =>
    {
        jsmk.EndSession(err);
    });
