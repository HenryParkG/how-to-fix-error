window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "fixing-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "C++",
    "code": "WiredTigerEvictionStall",
    "tags": [
        "AWS",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained heavy concurrent write workloads, MongoDB clusters experience high write latency spikes, query timeouts, and severe operational stalls caused by WiredTiger cache eviction threads failing to keep up with dirty page generation rates.</p>",
    "root_cause": "When dirty cache content exceeds WiredTiger's critical dirty threshold (typically >20% of cache size), storage engine application threads are forced to run eviction inline, blocking client operations while writing dirty pages to disk under lock contention.",
    "bad_code": "# Default mongod.conf settings vulnerable to dirty cache write spikes\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 8\n# Missing eviction thread and dirty page tuning parameters",
    "solution_desc": "Tune WiredTiger eviction worker thread counts, reduce dirty page eviction trigger thresholds, and configure proper IOPS scheduling on block storage to avoid dirty page saturation.",
    "good_code": "# Optimized mongod.conf + Set Parameter Invocations\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=5,eviction_dirty_trigger=10,eviction_target=75,eviction_trigger=80\"",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` and check `tracked dirty bytes in the cache`. Ensure dirty cache percentage remains under 10% and application eviction wait times drop to zero during high-throughput load tests.",
    "date": "2026-07-26",
    "id": 1785061782,
    "type": "error"
});