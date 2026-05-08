window.onPostDataLoaded({
    "title": "Resolving MongoDB WiredTiger Cache Eviction Contention",
    "slug": "mongodb-wiredtiger-cache-eviction-fix",
    "language": "C++",
    "code": "WT_CACHE_FULL",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy MongoDB clusters, the WiredTiger storage engine can experience 'eviction contention'. When dirty pages in the cache exceed the eviction_dirty_trigger (default 20%), user threads are forced to perform eviction themselves. This leads to massive latency spikes and throughput drops as application threads stop processing writes to clean up the cache.</p>",
    "root_cause": "The rate of incoming writes exceeds the I/O capacity of the eviction threads to flush dirty pages to disk, causing application thread 'eviction involvement'.",
    "bad_code": "// Default configuration in mongod.conf under heavy load\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n// No specific eviction tuning, leading to default 20% triggers",
    "solution_desc": "Adjust the WiredTiger eviction worker threads and lower the dirty trigger to start background eviction earlier, preventing user threads from being hijacked.",
    "good_code": "// Optimized tuning for high-write workloads\ndb.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=95,eviction_dirty_target=3,eviction_dirty_trigger=5,eviction_workers_min=4,eviction_workers_max=12\"\n})",
    "verification": "Monitor 'wiredTiger.cache.tracked dirty bytes in the cache' and 'eviction activity' in mongostat or Atlas metrics.",
    "date": "2026-05-08",
    "id": 1778217804,
    "type": "error"
});