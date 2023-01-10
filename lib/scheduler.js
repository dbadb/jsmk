/* global jsmk */
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
        this.m_concurrentCount = 0;
        this.m_errorCount = 0;
        this.m_state = "running";
        this.m_queue = []; // of promiseIterators
        this.m_draining = false;
    }

    GetConcurrentCount()
    {
        return this.m_concurrentCount;
    }

    GetQueueLength()
    {
        return this.m_queue.length;
    }

    Append(promiseIterator, barrier)
    {
        if(this.m_queue.length === this.m_maxQueueLength)
        {
            throw new Error("Queue length exceeded: " + this.m_queue.length);
        }
        else
        {
            if(barrier && barrier !== "before")
                throw new Error("Unsupported barrier type: " + barrier);
            // jsmk.INFO("Append " + (promiseIterator ? promiseIterator._name : barrier));
            this.m_queue.push({
                        nm: promiseIterator ? promiseIterator._name : "_empty_",
                        id: this.m_queue.length,
                        iterator: promiseIterator,
                        barrier: barrier,
                        concurrent: [], // list of concurrent for *this entry*
                        blocking: null,
                        pending: null,
                        });
            this.logQueue();
            try
            {
                this.processQueue();
            }
            catch (e)
            {
                jsmk.ERROR("Append error:"  + e.stack);
                this.m_state = "error";
            }
        }
    }

    Drain(stage)
    {
        function sleep(ms) 
        {
            return new Promise(u => setTimeout(u, ms));
        }
        let self = this;
        return new Promise((resolve, reject) => {
            // jsmk.NOTICE(`Draining ${stage} ...`);
            self.m_draining = true;
            (async () => {
                let counter = 0;
                while(true)
                {
                    self.processQueue();
                    if(self.m_state === "done" || self.m_state === "error")
                        break;
                    await sleep(100);
                    counter += 1;
                    // process.stdout.write(".");
                }
                // process.stdout.write("\n");
                jsmk.DEBUG(`Drained  ${stage} ${counter} ${self.m_state}`);
                if(self.m_state == "done" && self.m_errorCount == 0)
                    resolve();
                else    
                    reject();
            })();
        });
    }

    logQueue()
    {
        if(false)
        {
            jsmk.NOTICE("SchedulerQBegin {");
            for(let e of this.m_queue)
                jsmk.NOTICE("  " + e.nm + (e.barrier ? ` (${e.barrier})` : ""));
            jsmk.NOTICE("SchedulerQEnd }");
        }
    }

    // processQueue:
    //  tries to ensure that at least one worker is scheduled
    //  for each iteration
    processQueue()
    {
        // states:
        //  "running" - normal operation mode
        //  "bailing" - error condition where no additional work
        //              scheduled, but concurrent work is allowed to finish.
        //  "waiting" - fully scheduled... can't drain 'til after
        //              we're out of the state.
        //  "done" - signal to stop draining
        //  "error" - signal to stop draining
        if(this.m_concurrentCount >= this.m_maxConcurrency)
        {
            // process.stdout.write(this.m_queue.length ? "." : "");
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
        // jsmk.NOTICE("processQueue " + this.m_queue.length);
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
                            this.logQueue();
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
                return this.processQueue(); // recur
            else
                return true; // we're at maxConcurrency
        }
        else
        if(this.m_concurrentCount === 0)
        {
            if(this.m_state === "bailing")
            {
                this.m_state = "error";
                return false;
            }
            if(this.m_queue.length > 0)
                return this.processQueue();
            else
            {
                if(this.m_draining)
                    this.m_state = "done";
                return false;
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
        // jsmk.NOTICE("scheduling " + newwork._name);
        return new Promise((resolve, reject) =>
        {
            resolve(newwork);
        })
        .then((value) => // success
        {
            // jsmk.INFO("done:" + newwork._name);
            this.m_concurrentCount--;
            this.cleanupPromises(newwork);
            this.processQueue(); // recur...
        })
        .catch((err) =>
        {
            if(!err)
                jsmk.ERROR("Scheduler command reject");
            else
            {
                jsmk.ERROR("Scheduler "+(err.stack ? err.stack : err));
            }
            this.m_errorCount++;
            this.m_concurrentCount--;
            this.cleanupPromises(newwork);
            if(true)  //  to-do forge ahead
            {
                this.m_state = "bailing";
                this.m_queue = [];
            }
            this.processQueue(); // recur...
        });
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
        if(this.m_state !== "bailing")
            throw Error("dangling promise:" + completed._name);
    }
}

exports.Scheduler = Scheduler;
