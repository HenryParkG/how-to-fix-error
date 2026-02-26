window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-stalls",
    "language": "SQL",
    "code": "CacheEvictionStall",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-write MongoDB clusters, the WiredTiger storage engine may experience 'eviction stalls'. This occurs when the rate of incoming writes exceeds the rate at which the eviction server threads can clear space in the cache.</p><p>When the cache reaches a critical threshold (typically 95%), application threads are forced to perform 'application thread eviction,' effectively pausing database operations to clear memory. This manifests as sudden latency spikes and throughput drops.</p>",
    "root_cause": "The WiredTiger cache fill ratio hits the 'eviction_trigger' threshold, causing application threads to block while they assist in synchronous cache cleanup.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Default settings without tuning for high-write loads",
    "solution_desc": "Lower the eviction trigger and target thresholds to start background eviction earlier. Increase the number of eviction worker threads to ensure the background process stays ahead of the write volume.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=80,eviction_target=70,eviction_dirty_trigger=15,eviction_dirty_target=10,eviction_threads_min=4,eviction_threads_max=8\"\n})",
    "verification": "Monitor the 'wiredTiger.cache.eviction-stalls' metric in mongostat or Atlas metrics. Stalls should drop to zero.",
    "date": "2026-02-26",
    "id": 1772098807,
    "type": "error"
});