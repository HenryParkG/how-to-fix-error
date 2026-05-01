window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-stalls",
    "language": "Go",
    "code": "CacheStall",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained high-write pressure, MongoDB's WiredTiger storage engine can experience 'eviction stalls.' This happens when the rate of dirty pages created exceeds the background eviction threads' ability to clear them. When the dirty cache reaches 20% (default), WiredTiger triggers 'application threads eviction,' where the actual database request threads are forced to perform cleanup, causing massive latency spikes (p99) and throughput drops.</p>",
    "root_cause": "The write volume exceeds the capacity of the configured eviction worker threads, causing the cache to fill with 'dirty' unwritten data.",
    "bad_code": "db.adminCommand({ \n  setParameter: 1, \n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=80,eviction_trigger=95\"\n}); \n// High trigger values delay eviction until it is too late.",
    "solution_desc": "Lower the eviction trigger and target thresholds to start clearing the cache earlier, and increase the number of eviction worker threads to handle the concurrent write load.",
    "good_code": "db.adminCommand({ \n  setParameter: 1, \n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=10,eviction_target=5,eviction_threads_min=4,eviction_threads_max=8\"\n});",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric. It should stay consistently below the trigger threshold without flat-lining application throughput.",
    "date": "2026-05-01",
    "id": 1777615208,
    "type": "error"
});