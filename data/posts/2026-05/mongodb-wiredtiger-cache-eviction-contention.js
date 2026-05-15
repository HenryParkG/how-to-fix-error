window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Contention",
    "slug": "mongodb-wiredtiger-cache-eviction-contention",
    "language": "SQL",
    "code": "WiredTigerCacheStall",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine manages an internal cache to minimize disk I/O. In write-heavy shards, the rate of 'dirty' data accumulation can exceed the capacity of the background eviction threads. When the cache reaches the 'eviction_trigger' (usually 80%), application threads are forced to perform 'in-line' eviction. This causes a massive spike in latency for standard CRUD operations as the database threads are busy flushing pages to disk instead of processing queries, leading to a contention death spiral.</p>",
    "root_cause": "The write volume exceeds the throughput of background eviction threads, triggering application-thread-assisted eviction.",
    "bad_code": "// Default config often insufficient for 90%+ write workloads\ndb.adminCommand({setParameter: 1, wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=4,threads_max=4)\"})",
    "solution_desc": "Increase the number of eviction threads and lower the target dirty percentage to start eviction earlier. This keeps the cache cleaner and prevents application threads from being hijacked for eviction tasks.",
    "good_code": "db.adminCommand({\n  setParameter: 1, \n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=8,threads_max=16)\",\n  wiredTigerConcurrentReadTransactions: 128,\n  wiredTigerConcurrentWriteTransactions: 128\n})",
    "verification": "Check 'db.serverStatus().wiredTiger.cache' for 'tracked dirty bytes in the cache'. Ensure 'eviction worker thread evicting pages' is high while 'application threads page read/write' stays low.",
    "date": "2026-05-15",
    "id": 1778811131,
    "type": "error"
});