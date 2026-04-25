window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-stalls",
    "language": "Go",
    "code": "LatencySpike",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a ticket-based system for concurrency and a background eviction process to keep the cache clean. Under heavy write pressure, if the 'dirty' data in the cache exceeds the <code>eviction_dirty_trigger</code> (default 20%), WiredTiger forces application threads to perform eviction (page-to-disk writes). This results in massive latency spikes (stalls) for CRUD operations as client threads are hijacked to do maintenance work.</p>",
    "root_cause": "The rate of data modification exceeds the disk I/O throughput or the background eviction thread capacity, causing the cache to reach the 'hard' dirty limit.",
    "bad_code": "// Default configuration on low-IOPS storage\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Often too small for the working set",
    "solution_desc": "Aggressively tune the WiredTiger eviction parameters. Lower the <code>eviction_dirty_target</code> to start background eviction earlier and increase <code>eviction_threads_max</code>. If using SSDs, increase the target to prevent the application from being throttled, and ensure the <code>cacheSizeGB</code> is set to 50-60% of available RAM.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_threads_min=4,eviction_threads_max=8\"\n})",
    "verification": "Monitor `mongostat` and check `wiredTiger.cache.tracked dirty bytes in the cache`. If it consistently hits the trigger % and 'app threads page-in/eviction' counts rise, further tuning is needed.",
    "date": "2026-04-25",
    "id": 1777100664,
    "type": "error"
});