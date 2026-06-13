window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "fixing-wiredtiger-cache-eviction-stalls-mongodb",
    "language": "MongoDB",
    "code": "CacheEvictionStall",
    "tags": [
        "MongoDB",
        "Database",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Under high-throughput write workloads, MongoDB clusters frequently experience sudden response latency spikes. This is caused by WiredTiger cache eviction stalls. When the percentage of dirty data in the WiredTiger cache exceeds the configured thresholds, the background eviction threads cannot write data to disk fast enough. As a result, WiredTiger forces user/client application threads to perform sync evictions, stalling active writes and causing database connection queues to exhaust quickly.</p>",
    "root_cause": "The volume of dirty data in memory generates faster than background threads can flush it to persistent storage, triggering synchronous inline client evictions when the dirty byte threshold exceeds 20% of the cache size.",
    "bad_code": "# Default mongod.conf settings under high write IOPS pressure\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# No explicit background eviction adjustments are configured.",
    "solution_desc": "Optimize WiredTiger eviction configuration dynamically or via configuration parameters. Increase the minimum and maximum active eviction threads, and lower the dirty target and trigger thresholds to force aggressive asynchronous eviction before the system resorts to client-thread stalls.",
    "good_code": "# Tuned mongod.conf for high write workloads\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_trigger=5,eviction_dirty_target=3\"\n# Lowering trigger (5%) and target (3%) prevents dirty spikes.",
    "verification": "Monitor the WiredTiger engine behavior using mongostat and run: db.serverStatus().wiredTiger.cache[\"hazard pointer blocked page eviction\"] and verify that client session evictions drop to zero during heavy load spikes.",
    "date": "2026-06-13",
    "id": 1781349069,
    "type": "error"
});