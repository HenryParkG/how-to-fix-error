window.onPostDataLoaded({
    "title": "Resolving MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-stalls",
    "language": "SQL",
    "code": "Latency Spike",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy MongoDB clusters, the WiredTiger storage engine uses a cache to stage data before flushing to disk. When 'dirty' data (unflushed writes) exceeds a certain threshold (default 20%), WiredTiger triggers 'application threads' to assist in eviction. This causes massive latency spikes because threads meant for processing queries are suddenly blocked doing disk I/O cleanup.</p>",
    "root_cause": "The rate of incoming writes exceeds the underlying disk's IOPS capacity, causing the WiredTiger cache to fill with dirty pages faster than the background eviction threads can clear them.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Fixed size, but no tuning for eviction",
    "solution_desc": "Tune the WiredTiger eviction worker threads and adjust the dirty trigger thresholds. Increase the number of eviction threads and lower the 'eviction_trigger' to start background cleaning earlier, preventing application threads from being hijacked.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=8),eviction_dirty_trigger=5,eviction_dirty_target=3\"\n})",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric using mongostat or CloudWatch. Ensure it stays below the trigger point.",
    "date": "2026-03-03",
    "id": 1772519970,
    "type": "error"
});