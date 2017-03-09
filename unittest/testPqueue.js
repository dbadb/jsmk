let Scheduler = require("../lib/Scheduler").Scheduler;

let maxc = 5;

function *genWork(nm) 
{
    let c = 0;
	while(c <= maxc)
	{
        let nmc = `${nm}.${c}`;
        let block = (c === 3) ? "before" : null;
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


var pqueue = new Scheduler(
                        {
                            maxConcurrency: 3,
                            onDone: function() { console.log("Queue empty"); }
                        }
                        );

for(let i=0;i<1000;i++)
{
    pqueue.Append(genWork("p"+i));
}

