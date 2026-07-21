window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls",
    "slug": "fixing-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "CacheEvictionStall",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Under high-concurrency write and update workloads, MongoDB's storage engine, WiredTiger, can suffer from severe cache eviction stalls. When the percentage of dirty pages in the WiredTiger cache exceeds the configured threshold, user threads are forced to participate in synchronous page eviction rather than executing write operations. This shifts the execution profile from background thread eviction to client thread blockages, causing massive latency spikes (P99 latency degradation) and dropping throughput to near zero.</p>",
    "root_cause": "The generation rate of dirty pages from concurrent updates exceeds the background eviction threads' capacity to write pages to disk. Once dirty pages reach the hard 'eviction_dirty_trigger' limit, MongoDB blocks incoming writes and forces the client threads to perform synchronous eviction to reclaim cache memory.",
    "bad_code": "# Default mongod.conf without eviction-specific tuning under intensive write volumes\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16",
    "solution_desc": "Architecturally tune WiredTiger's internal cache eviction parameters. Increase the minimum and maximum background eviction threads to scale with system core count, and aggressively lower the dirty target and trigger thresholds to force background eviction to begin much earlier, preventing user threads from ever taking over the eviction duty.",
    "good_code": "# Tuned mongod.conf optimized for high-concurrency write workloads\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_target=80,eviction_trigger=95\"",
    "verification": "Monitor eviction activity using the command `db.serverStatus().wiredTiger.cache`. Ensure that 'tracked dirty bytes in the cache' stays below the 15% threshold and verify that 'eviction worker thread evicting pages' is actively processing while 'force write operations to wait for space' remains at 0.",
    "date": "2026-07-21",
    "id": 1784598473,
    "type": "error"
});