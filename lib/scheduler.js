
/**
 * Scheduler:
 *  schedules work represented by a queue of Promise iterators/generators.
 *  unit of work (worker) can declare itself blocking which means that
 *  all concurrent units of work associated with a queue entry must complete
 *  prior to its scheduling.
 *
 *  To establish cross queue-entry dependencies we require the iterator
 *  to request a barrier.   This means that its work isn't schedulable
 *  until after all proceeding entries have been drained.  Note that
 *  this design represents a useful subset of the behavior of a
 *  dependency graph with a much smaller cost to the "job designer"
 *  for expressing dependencies.
 *
 *  Clients should construct a Schedule with the required configuration
 *  values.  Then issue multiple Appends.  We operate asynchronously
 *  so in order to continue "when done", client establishes
 *  onDone and onError callbacks.
 *
 *  Known issues:
 *    - since calls to Append don't return a promise there is a race
 *      between calls to onDone and onError with currently outstanding
 *      coroutines. (this results in premature onDone invocations).

)
 */
class Scheduler
{
    constructor(config)
    {
        if(!config) config = {};
        this.m_name = config.name ? config.name : "<unnamed>";
        this.m_maxQueueLength = config.maxQueueLength ? config.maxQueueLength : Infinity;
        this.m_maxConcurrency = config.maxConcurrency ? config.maxConcurrency : Infinity;
        this.m_onDone = config.onDone; // may be undefined
        this.m_onError = config.onError;
        this.m_concurrentCount = 0;
        this.m_state = "running";
        this.m_queue = []; // of promiseIterators
    }

    Append(promiseIterator, barrier)
    {
        if(this.m_queue.length === this.m_maxQueueLength)
        {
            throw new Error("Queue length exceeded: " + this.m_queue.length);
        }
        else
        {
            this.m_queue.push({
                        id: this.m_queue.length,
                        iterator: promiseIterator,
                        concurrent: [], // list of concurrent for *this entry*
                        blocking: null,
                        pending: null,
                        barrier: barrier,
                        });
            try
            {
                this.processQueue();
            }
            catch (e)
            {
                jsmk.ERROR("Append error:"  + e.stack);
                if(this.m_onError)
                    this.m_onError(e);
            }
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

        // states:
        //  "running" - normal operation mode
        //  "bailing" - error condition where no additional work
        //              scheduled, but concurrent work is allowed to finish.
        //  "waiting" - fully scheduled... can't drain 'til after
        //              we're out of the state.
        if(this.m_concurrentCount >= this.m_maxConcurrency)
        {
            // process.stdout.write(this.m_queue.length ? "." : "");
            let oldstate = this.m_state;
            if(this.m_state !== "waiting" && this.m_queue.length > 0)
            {
                this.m_state = "waiting";
                setTimeout(function() {
                    if(self.m_state === "waiting")
                        self.m_state = oldstate;
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
        //      -p._blocking == "before" -- asserts that all work prior to
        //        the work-unit eminating the same queue-entry must complete
        //        before it can be scheduled.
        //  - cross queue-entry dependencies are handled at
        //        the level of the promise iterator as distinct from
        //        the individual promise.
        let newwork;
        for(let i=0;i<this.m_queue.length;i++)
        {
            if(this.m_state === "bailing")
                break;

            let entry = this.m_queue[i];
            if(entry.barrier === "before" && i !== 0)
            {
                // jsmk.NOTICE("barrier active");
                break;  // no more work can be scheduled after a barrier
            }
            else
            if(!entry.blocking)
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
                    if(!it)
                    {
                        newwork = null;
                    }
                    else
                    if(it._blocking === "before")
                    {
                        if(i > 0)
                        {
                            jsmk.DEBUG("Qel block ----------------");
                            break; // bail 'til we're shifted into slot 0
                        }
                        else
                        {
                            newwork = it.next().value;
                            if(newwork)
                                jsmk.DEBUG("Qel proceed " + newwork._name);
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
                            // console.log("splice: " + entry.id);
                            this.m_queue.splice(i, 1);
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
                    throw new Error("Bogus _blocking " + newwork._blocking);
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
                return true; // we're at maxConcurrency
        }
        else
        if(this.m_concurrentCount === 0)
        {
            if(this.m_state === "bailing")
            {
                if(this.m_onError)
                {
                    // jsmk.NOTICE("scheduler error");
                    this.m_onError(this.m_name + " bailed");
                    return false;
                }
            }
            if(this.m_queue.length > 0)
                return this.processQueue();
            else
            {
                if(this.m_onDone)
                {
                    // jsmk.NOTICE("scheduler done");
                    this.m_onDone();
                    return false;
                }
            }
        }
        else
            return false; // no new work, some still running
    }

    scheduleIt(newwork)
    {
        // we want the act of scheduling to be "asynchronous"
        //  so we wrap one promise within another.  When a promise
        //  is resolved, we re-examine the queue for additional work.
        let self = this;
        return new Promise(function(resolve, reject) {
                resolve(newwork);
            })
            .then
            (
                function (value) // success
                {
                    // console.log("done:" + newwork._name);
                    self.m_concurrentCount--;
                    self.cleanupPromises(newwork);
                    self.processQueue(); // recur...
                }
            )
            .catch
            (
                function (err) // error
                {
                    if(!err)
                        jsmk.ERROR("Scheduler command reject");
                    else
                        jsmk.ERROR("Scheduler:" + err.stack ? err.stack : err)
                    self.m_concurrentCount--;
                    self.cleanupPromises(newwork);
                    if(true)  //  to-do forge ahead
                    {
                        self.m_state = "bailing";
                        self.m_queue = [];
                    }
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
        if(this.m_state !==  "bailing")
            throw Error("dangling promise:" + completed._name);
    }
}

exports.Scheduler = Scheduler;
