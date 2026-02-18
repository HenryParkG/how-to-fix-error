window.onPostDataLoaded({
    "title": "Resolving WiredTiger Cache Eviction Contention in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-contention",
    "language": "MongoDB",
    "code": "CacheContention",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput MongoDB clusters often hit a 'performance cliff' when the WiredTiger cache becomes full. When dirty pages exceed the <code>eviction_trigger</code>, application threads are forced to participate in eviction (application-side eviction), which leads to massive latency spikes and lock contention. In clusters with high write-concurrency, the eviction threads cannot keep up, causing the global WiredTiger tick to stall and blocking all I/O operations until the cache pressure is relieved.</p>",
    "root_cause": "Mismatch between the rate of data ingress and the WiredTiger eviction thread capacity, combined with default settings that allow too much dirty data to accumulate before aggressive eviction kicks in.",
    "bad_code": "// Default configuration under heavy 100k+ OPS load\nstorage.wiredTiger.engineConfig.cacheSizeGB: 16\n// No custom eviction tuning, leading to default 20% dirty trigger",
    "solution_desc": "Tune the WiredTiger engine to use more background eviction threads and lower the dirty page triggers. This forces the database to start cleaning the cache earlier and more aggressively without stalling user queries.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=20),eviction_dirty_trigger=5,eviction_dirty_target=3\"\n});",
    "verification": "Monitor 'wiredtiger.cache.tracked dirty bytes in the cache' and 'app threads page eviction' using mongostat or Cloud Manager.",
    "date": "2026-02-18",
    "id": 1771397580,
    "type": "error"
});