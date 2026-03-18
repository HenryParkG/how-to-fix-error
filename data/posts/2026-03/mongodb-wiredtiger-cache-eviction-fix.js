window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Contention in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-fix",
    "language": "Go",
    "code": "WT_CACHE_FULL",
    "tags": [
        "SQL",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, uses an internal cache to manage data pages. In write-heavy workloads, 'dirty' pages (modified data not yet written to disk) can accumulate faster than the eviction threads can clear them. When the cache hits its pressure threshold, user threads are forced to assist in eviction, causing massive latency spikes (p99 latency) and throughput collapse. This is common in cloud environments where disk I/O (IOPS) is throttled.</p>",
    "root_cause": "The write throughput exceeds the disk's ability to flush the checkpoint, leading to more than 20% of the WiredTiger cache being filled with dirty pages, triggering aggressive foreground eviction.",
    "bad_code": "// Default configuration often fails under 10k+ ops/sec\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n// No explicit tuning for eviction thread behavior",
    "solution_desc": "Increase the number of WiredTiger eviction threads and tune the eviction triggers to start clearing the cache earlier, preventing the 'cliff' where user threads are hijacked for eviction tasks.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=85,eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_threads_min=4,eviction_threads_max=12\"\n});",
    "verification": "Run 'db.serverStatus().wiredTiger.cache' and verify that 'tracked dirty bytes in the cache' stays below the 'eviction_dirty_trigger' threshold.",
    "date": "2026-03-18",
    "id": 1773796827,
    "type": "error"
});