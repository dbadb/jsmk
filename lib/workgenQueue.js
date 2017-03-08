
/**
 * WorkgenQueue:
 *  An implementation of a queue of Promise iterators (generators).
 *  Used to schedule async + concurrent work.
 *
 * @example
 *
 * var queue = new WorkgenQueue(1);
 *
 */
class WorkgenQueue
{
    constructor(config)
    {
        if(!config) config = {};
        this.m_maxQueueLength = config.maxQueueLength ? config.maxQueueLength : Infinity;
        this.m_maxConcurrency = config.maxConcurrency ? config.maxConcurrency : Infinity;
        this.m_onDone = config.onDone; // may be undefined
        this.m_concurrentCount = 0;
        this.m_waiting = false;
        this.m_queue = []; // of promiseIterators
    }

    Append(promiseIterator)
    {
        if(this.m_queue.length === this.m_maxQueueLength)
        {
            throw "Queue length exceeded: " + this.m_queue.length;
        }
        else
        {
            this.m_queue.push({
                            iterator: promiseIterator,
                            concurrentPromises: [],
                            blockingPromise: null,
                            pendingPromise: null,
                            });
            this.processQueue();
        }
    }

    GetConcurrentCount()
    {
        return this.m_concurrentCount;
    }

    GetQueueLength()
    {
        return this.m_queue.length;
    }

    // processQueue:
    processQueue()
    {
        if(this.m_queue.length === 0)
        {
            if(this.m_concurrentCount === 0 &&
               this.m_onDone)
            {
                this.m_onDone();
            }
            else
            {
                console.log("still draining");
                setTimeout(function() {
                    self.processQueue();
                }, 50);
            }
        }

        let self = this;
        if (this.m_concurrentCount >= this.m_maxConcurrency)
        {
            process.stdout.write(".");
            if(!this.m_waiting && this.m_queue.length > 0)
            {
                this.m_waiting = true;
                setTimeout(function() {
                    self.m_waiting = false;
                    self.processQueue();
                }, 50);
            }
            return false;
        }

        // Schedule some new work...
        //  - priority given to earliest available queue entry
        //  - a queue entry can be in a blocked state as signified by
        //      q[i].blockingPromise
        //  - when a new unit of work arrives,
        //      -p._block == "gather" -- asserts that all work prior to
        //        the work-unit eminating the same queue-entry must complete
        //        before it can be scheduled.
        //  - cross queue-entry dependencies are handled at
        //        the level of the promise iterator as distinct from
        //        the individual promise.
        let workPending = false;
        let p;
        for(let i=0;i<this.m_queue.length;i++)
        {
            let entry = this.m_queue[i];
            if(!entry.blockingPromise)
            {
                if(!entry.pendingPromise)
                {
                    let it = entry.iterator;
                    // here we'll check if entire iterator is blocked.
                    p = it.next().value;
                    if(!p)
                    {
                        if(entry.concurrentPromises.length === 0)
                        {
                            // iterator has no more work to offer,
                            //      (no blockingPromise either)
                            console.log("splice: " + i);
                            this.m_queue.splice(i, 1);
                        }
                        else
                            workPending = true;
                        continue;
                    }
                }
                else
                {
                    // check if we can schedule the pending process.
                    // (requires concurrentPromises to be empty)
                    if(entry.concurrentPromises.length > 0)
                        continue;
                    else
                        p = entry.pendingPromise; // pendingPromise cleared below
                }
                // we've found something to do!
                if(p._blocking === "before")
                {
                    if(p === this.pendingPromise)
                    {
                        entry.blockingPromise = p;
                        this.pendingPromise = null;
                    }
                    else
                    {
                        console.log(p._name + " now pending");
                        entry.pendingPromise = p;
                        p = null;
                        continue; // <----------------------------- defer
                    }
                }
                else
                if(p._blocking)
                    throw "Bogus _blocking " + p._blocking;
                // else p is ready to schedule
                entry.concurrentPromises.push(p);
                break; // <-------------------------------------- schedule it!
            }
        }
        if(p)
        {
            this.m_concurrentCount++;
            this.scheduleIt(p);
            return true;
        }
        else
        if(workPending)
        {
            console.log("work pending");
            this.scheduleIt();
        }
        else
            return false;
    }

    scheduleIt(promise)
    {
        // we want the act of scheduling to be "asynchronous"
        //  so we wrap one promise within another.  When a promise
        //  is resolved, we re-examine the queue for additional work.
        let self = this;
        new Promise(function(resolve) {
                resolve(promise);
            }).then(
                function (value) // success
                {
                    console.log("done:" + promise._name);
                    self.m_concurrentCount--;
                    self.cleanupPromises(promise);
                    self.processQueue(); // recur...
                },
                function (err) // error
                {
                    self.m_concurrentCount--;
                    self.cleanupPromises(promise);
                    self.processQueue(); // recur...
                }
            );
    }

    cleanupPromises(promiseCompleted)
    {
        // clear out the completion state... promises can block
        // multiple queue entries.
        for(let i=0;i<this.m_queue.length;i++)
        {
            let entry = this.m_queue[i];
            let ii = entry.concurrentPromises.indexOf(promiseCompleted);
            if(ii !== -1)
            {
                entry.concurrentPromises.splice(ii, 1);
                return;
            }
        }
        console.log("dangling promise:" + promiseCompleted._name);
    }
}

exports.WorkgenQueue = WorkgenQueue;
