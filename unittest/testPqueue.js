let WorkgenQueue = require("../lib/workgenQueue").WorkgenQueue;

let maxc = 5;

function *genWork(nm) 
{
    let c = 0;
	while(c <= maxc)
	{
        let nmc = `${nm}.${c}`;
        let block = (c === maxc) ? "before" : null;
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


var pqueue = new WorkgenQueue(
                        {
                            maxConcurrency: 2,
                            onDone: function() { console.log("Queue empty"); }
                        }
                        );

pqueue.Append(genWork("one"));
//pqueue.Append(genWork("two"));
//pqueue.Append(genWork("three"));
//pqueue.Append(genWork("4"));

