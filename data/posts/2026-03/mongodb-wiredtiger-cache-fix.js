window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-fix",
    "language": "SQL",
    "code": "CacheStall_WriteBlocking",
    "tags": [
        "SQL",
        "Infra",
        "MongoDB",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger cache eviction stalls occur when the rate of incoming writes exceeds the storage engine's ability to evict pages from memory to disk. When the cache usage hits the 'eviction_trigger' (default 95%), MongoDB throttles application threads to allow eviction to catch up. This manifests as sudden latency spikes (stalls) where write operations take seconds instead of milliseconds, severely impacting high-throughput applications.</p>",
    "root_cause": "The eviction worker threads are under-configured or the eviction targets are too high for the disk I/O bandwidth, causing the cache to fill faster than it can be cleared.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# No specific eviction tuning, defaults used",
    "solution_desc": "Lower the eviction triggers to start the background eviction process earlier and increase the number of eviction worker threads. This ensures that the engine aggressively clears space before the cache reaches the critical 95% threshold.",
    "good_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction_trigger=80,eviction_target=70,eviction_dirty_trigger=20,eviction_dirty_target=15,eviction_workers_min=4,eviction_workers_max=8\"",
    "verification": "Monitor 'mongostat' and check the 'wiredTiger.cache.tracked dirty pages in the cache' metric to ensure it stays below the trigger level.",
    "date": "2026-03-16",
    "id": 1773644786,
    "type": "error"
});