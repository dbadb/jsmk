
/**
 * Scheduler:
 *  schedules work represented by a queue of Promise iterators/generators.
 *  unit of work (worker) can declare itself blocking which means that
 *  all concurrent units of work associated with a queue entry must complete
 *  prior to its scheduling.
 *
 *  To establish cross queue-entry dependings we require the iterator
 *  to express blocking.   This means that its work isn't schedulable
 *  until after all proceeding entries have been drained.  Note that
 *  this design represents a useful subset of the behavior of a
 *  dependency graph with a much smaller cost to the "job designer"
 *  for expressing dependencies.
 *
 *  Clients should construct a Schedule with the required configuration
 *  values.  Then issue multiple Appends.  We operate asynchronously
 *  so in order to continue "when done", client establishs an onDone callback.
 *
 */
class Scheduler
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
                        id: this.m_queue.length,
                        iterator: promiseIterator,
                        concurrent: [], // list of concurrent for *this entry*
                        blocking: null,
                        pending: null,
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
    //  tries to ensure that at least one worker is scheduled
    //  for each iteration
    processQueue()
    {
        let self = this;
        if(this.m_queue.length === 0 ||
          this.m_concurrentCount >= this.m_maxConcurrency)
        {
            process.stdout.write(this.m_queue.length ? "." : ">");
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
        //      q[i].blocking
        //  - when a new unit of work arrives,
        //      -p._block == "gather" -- asserts that all work prior to
        //        the work-unit eminating the same queue-entry must complete
        //        before it can be scheduled.
        //  - cross queue-entry dependencies are handled at
        //        the level of the promise iterator as distinct from
        //        the individual promise.
        let newwork;
        for(let i=0;i<this.m_queue.length;i++)
        {
            let entry = this.m_queue[i];
            if(entry.blocking)
                continue;
            else
            {
                if(entry.pending)
                {
                    // check if we can schedule the pending process.
                    // (requires concurrentPromises to be empty)
                    if(entry.concurrent.length > 0)
                        continue; // no new work for this entry
                    else
                        newwork = entry.pending; // pending cleared below
                }
                else
                {
                    // nothing blocking, nothing pending...
                    let it = entry.iterator;
                    if(it._block === "before")
                    {
                        if(i > 0)
                        {
                            console.log("proj block --------------------------");
                            break; // bail 'til we're shifted into slot 0
                        }
                        else {
                            newwork = it.next().value;
                            if(newwork)
                                console.log("proj block proceed " + newwork._name);
                        }
                    }
                    else
                        newwork = it.next().value;
                    if(!newwork)
                    {
                        if(entry.concurrent.length === 0)
                        {
                            // iterator has no more work to offer,
                            //      (no blocking either)
                            console.log("splice: " + entry.id);
                            this.m_queue.splice(i, 1);
                            if(this.m_queue.length === 0)
                            {
                                if(this.m_onDone)
                                {
                                    this.m_onDone();
                                }
                            }
                        }
                        continue; // need to wait for concurrent to clear
                    }
                }
                // we've found something to do!
                if(newwork._blocking === "before")
                {
                    if(newwork === entry.pending)
                    {
                        // newwork was pending, now we can schedule
                        // it, no longer pending.
                        entry.blocking = newwork;
                        entry.pending = null;
                    }
                    else
                    {
                        // state-transition from new to pending
                        // since newwork is blocking and we haven't
                        // checked concurrency
                        // console.log(newwork._name + " now pending");
                        entry.pending = newwork;
                        newwork = null;
                        continue; // <----------------------------- defer
                    }
                }
                else
                if(newwork._blocking)
                    throw "Bogus _blocking " + newwork._blocking;
                // else p is ready to schedule
                entry.concurrent.push(newwork);
                break; // <-------------------------------------- schedule it!
            }
        } // end of loop
        if(newwork)
        {
            this.m_concurrentCount++;
            this.scheduleIt(newwork);
            if(this.m_concurrentCount < this.m_maxConcurrency)
                return this.processQueue();
            else
                return true;
        }
        else
        if(this.m_concurrentCount == 0)
        {
            return this.processQueue();
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
                    // console.log("done:" + promise._name);
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

    cleanupPromises(completed)
    {
        // clear out the completion state... promises can block
        // multiple queue entries.
        for(let i=0;i<this.m_queue.length;i++)
        {
            let entry = this.m_queue[i];
            let ii = entry.concurrent.indexOf(completed);
            if(ii !== -1)
            {
                if(entry.blocking === completed)
                    entry.blocking = null;
                entry.concurrent.splice(ii, 1);
                return;
            }
        }
        console.log("dangling promise:" + completed._name);
    }
}

exports.Scheduler = Scheduler;
