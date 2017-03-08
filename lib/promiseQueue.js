
/**
 * PromiseIteratorQueue:
 *  An implementation of a queue of Promise iterators (generators).
 *  Used to schedule async + concurrent work.
 *
 * @example
 *
 * var queue = new PromiseIteratorQueue(1);
 *
 */
class PromiseIteratorQueue
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
                            activePromise: null
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

    processQueue(promiseCompleted)
    {
        if(promiseCompleted)
            this.cleanupPromises(promiseCompleted);

        if(this.m_queue.length === 0)
        {
            if(this.m_concurrentCount === 0 &&
               this.m_onDone)
            {
                this.m_onDone();
                this.m_onDone = null;
            }
            return false;
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


        // schedule some new work...
        let it;
        let p;
        for(let i=0;i<this.m_queue.length;i++)
        {
            let entry = this.m_queue[i];
            if(!entry.activePromise)
            {
                it = entry.iterator;
                p = it.next().value;
                if(!p)
                {
                    // iterator has no more work to offer,
                    //      (no activePromises either)
                    // console.log("splice: " + i);
                    this.m_queue.splice(i, 1);
                    return this.processQueue();
                }
                else
                {
                    // We keep the activePromise since array index
                    // is not sufficient for unique id

                    // console.log("stash: " + p._name);
                    entry.activePromise = p;
                }
                break;
            }
        }
        if(p)
        {
            this.m_concurrentCount++;
            this.scheduleIt(p);
            return true;
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
                    self.m_concurrentCount--;
                    self.processQueue(promise); // recur...
                },
                function (err) // error
                {
                    self.m_concurrentCount--;
                    self.processQueue(promise); // recur...
                }
            );
    }

    cleanupPromises(promiseCompleted)
    {
        // clear out the completion state
        for(let i=0;i<this.m_queue.length;i++)
        {
            let entry = this.m_queue[i];
            if(entry.activePromise === promiseCompleted)
            {
                // console.log("cleanup promise:" + promiseCompleted._name);
                entry.activePromise = null;
                return;
            }
        }
        // not found...
        console.log("dangling promise:" + promiseCompleted._name);
    }

}

exports.PromiseIteratorQueue = PromiseIteratorQueue;
