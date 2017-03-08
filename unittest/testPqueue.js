let PromiseIteratorQueue = require("../lib/promiseQueue").PromiseIteratorQueue;

let maxc = 5;

function *genWork(nm) 
{
    let c = 0;
	while(c <= maxc)
	{
        let nmc = `${nm}.${c}`;
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
        yield newp;
	}
    // console.log(nm + " no more work to generate");
	return undefined;
}


var pqueue = new PromiseIteratorQueue(
                        {
                            maxConcurrency: 1,
                            onDone: function() { console.log("Queue empty"); }
                        }
                        );

pqueue.Append(genWork("one"));
pqueue.Append(genWork("two"));
pqueue.Append(genWork("three"));
pqueue.Append(genWork("4"));

