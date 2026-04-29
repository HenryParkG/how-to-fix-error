window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Python",
    "code": "CacheEvictionStall",
    "tags": [
        "Python",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>During write-heavy operations involving MongoDB Change Streams, the WiredTiger storage engine may experience cache eviction stalls. This happens because Change Streams require the oplog to remain accessible, and high write volume fills the cache with 'dirty' pages faster than the eviction threads can write them to disk.</p>",
    "root_cause": "The eviction server cannot keep up with the rate of page dirtying, causing application threads to be conscripted into performing eviction, which leads to massive latency spikes.",
    "bad_code": "// Default settings in a 10k ops/sec environment\ndb.adminCommand({setParameter: 1, wiredTigerEngineRuntimeConfig: \"eviction_target=80,eviction_trigger=95\"})",
    "solution_desc": "Proactively tune WiredTiger eviction parameters to start clearing the cache earlier and increase the number of worker threads. Reducing the `eviction_trigger` and `eviction_target` ensures the engine works harder to keep the cache clean before it hits critical levels.",
    "good_code": "db.adminCommand({\n  setParameter: 1, \n  wiredTigerEngineRuntimeConfig: \"eviction_target=60,eviction_trigger=70,eviction_dirty_target=5,eviction_dirty_trigger=10\"\n})",
    "verification": "Monitor `wiredTiger.cache.tracked dirty bytes in the cache` via `db.serverStatus()` to ensure it stays below the trigger threshold.",
    "date": "2026-04-29",
    "id": 1777441578,
    "type": "error"
});