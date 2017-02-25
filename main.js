var err = false;

global.jsmk = require('./lib/jsmk.js').NewJsmk();

try
{
    jsmk.BeginSession();
    try
    {
        jsmk.DoBuilds();
    }
    catch(ex)
    {
        if(ex)
        {
            jsmk.ERROR(ex);
            err = true;
        }
    }
}

catch (ex)
{
    if (ex)
    {
        jsmk.ERROR(ex);
        err = true;
    }
}

finally
{
    jsmk.EndSession(err);
}
