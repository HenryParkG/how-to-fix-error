window.onPostDataLoaded({
    "title": "Resolving WiredTiger Cache Pressure & Journal Sync",
    "slug": "mongodb-wiredtiger-cache-pressure-journal-sync",
    "language": "SQL",
    "code": "WT_CACHE_FULL / WriteStall",
    "tags": [
        "SQL",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy MongoDB deployments, the WiredTiger storage engine can experience dirty page saturation where dirty cache percentage exceeds internal eviction thresholds. When dirty pages surpass <code>eviction_dirty_trigger</code> (default 20%), client application threads are hijacked into synchronous page flushing routines.</p><p>Coupled with disk I/O bottlenecks during journal fsync operations, this leads to connection pool exhaustion, cascading read/write stalls, and timeouts across all database clients.</p>",
    "root_cause": "The WiredTiger dirty cache growth outpaced background eviction workers, causing the storage engine to throttle client threads and force inline page reconciliation against a saturated disk subsystem.",
    "bad_code": "# Default container configuration with inadequate cache provisioning\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n# Default wiredTiger cacheSizeGB allocates 50% RAM minus 1GB\n# Under container limits without cgroup awareness, WT over-allocates\n# and stalls when dirty pages exceed standard 20% limit without dedicated eviction threads",
    "solution_desc": "Explicitly configure `wiredTigerCacheSizeGB` based on container memory limits, increase background eviction thread allocations, lower dirty trigger thresholds to begin background eviction earlier, and group commit journal writes to alleviate disk write amplification.",
    "good_code": "storage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n    commitIntervalMs: 100\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 4\n      configString: \"eviction=(threads_min=4,threads_max=8),eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_target=75,eviction_trigger=90\"\n    collectionConfig:\n      blockCompressor: snappy\n\nprocessManagement:\n  fork: false",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` in mongosh and verify that `tracked dirty bytes in the cache` stays below `eviction_dirty_trigger` and `client calls to trigger eviction` remains at 0.",
    "date": "2026-08-29",
    "id": 1787979218,
    "type": "error"
});