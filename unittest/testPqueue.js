let Scheduler = require("../lib/Scheduler").Scheduler;


function *genWork(nm, config) 
{
    let c = 0;
	while(c <= config.maxChildren)
	{
        let nmc = `${nm}.${c}`;
        let block = config.taskBlocking ? ((c === 3) ? "before" : null) : null;;
        if(block)
            nmc += ".----block-----";
        console.log("gen " + nmc);
        c++;
        let newp = new Promise(function(fulfill, reject) {
            let tryit = function()
            {
                try
                {
                    console.log("timeout " + nmc);
                    fulfill();
                }
                catch(e)
                {
                    console.log(nmc + e);
                    reject(e);
                }
            };
            setTimeout(tryit, 500 + 1500 * Math.random());
		});
        newp._name = nmc;
        newp._blocking = block;
        yield newp;
	}
    // console.log(nm + " no more work to generate");
	return undefined;
}


function testProjBlocking(config)
{
    var pqueue = new Scheduler(
                            {
                                maxConcurrency: 4,
                                onDone: function() { 
                                    console.log("---- done testProjBlocking"); 
                                    if(config && config.onDone)
                                        config.onDone();
                                }
                            }
                        );

    console.log("\n\nbegin testProjBlocking---------------------------------");
    for(let i=0;i<10;i++)
    {
        let workgen = genWork("p"+i, {taskBlocking: false,
                                      maxChildren: 5});
        if(i==5) workgen._block = "before";
        pqueue.Append(workgen);
    }
}


function testTaskBlocking(config)
{
    let serialize = config ? config.serialize : false;
    console.log(`\n\nbegin testTaskBlocking (serialize: ${serialize})------------------------------`);
    var pqueue = new Scheduler(
                            {
                                maxConcurrency: serialize ? 1 : 4,
                                onDone: function() { 
                                    console.log("done testTask----------------------"); 
                                    if(config && config.onDone)
                                        config.onDone();
                                }
                            }
                        );
    for(let i=0;i<5;i++)
    {
        let workgen = genWork("p"+i, {taskBlocking: true,
                                      maxChildren: 5});
        pqueue.Append(workgen);
    }
}


if(true)
{
    testTaskBlocking({
            serialize: false,
            onDone: testTaskBlocking.bind(null, 
                {
                    serialize: true,
                    onDone: testProjBlocking.bind( {
                    }),
                }),
            });
}
else
{
    testTaskBlocking({serialize: true});
}


