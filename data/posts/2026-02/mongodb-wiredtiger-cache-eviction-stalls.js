window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Infra",
    "code": "CACHE_EVICTION_STALL",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In MongoDB, the WiredTiger storage engine manages a cache for data pages. When write volume is extremely high, the rate of 'dirty' pages can exceed the background eviction capability. When dirty pages reach a critical threshold (usually 20%), WiredTiger forces application threads to perform eviction themselves.</p><p>This is known as a 'cache pressure stall.' Application latency spikes from milliseconds to seconds because the threads meant to handle queries are busy writing data to disk to free up space in the cache.</p>",
    "root_cause": "The write throughput exceeds the underlying I/O capacity or the eviction worker threads are not aggressive enough for the workload.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 1 # Too small for high-write volume\n# Default eviction settings usually fail at >20k ops/sec",
    "solution_desc": "Increase the cache size to reduce the frequency of eviction, and tune the eviction triggers to start cleaning earlier. This prevents the 'application-thread-eviction' panic state.",
    "good_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction_target=70,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15\"",
    "verification": "Use `db.serverStatus().wiredTiger.cache` and check 'tracked dirty pages in the cache'. If it stays below the 'eviction_dirty_trigger', stalls will not occur.",
    "date": "2026-02-15",
    "id": 1771118457,
    "type": "error"
});