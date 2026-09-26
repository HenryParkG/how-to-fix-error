window.onPostDataLoaded({
    "title": "Resolve MongoDB WiredTiger Cache Stalls & Cascades",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "WT_CACHE_FULL",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "Database",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, maintains an in-memory page cache partitioned into clean and dirty pages. Background eviction threads reconcile dirty pages to disk based on predefined percentage watermarks (defaulting to 5% dirty start, 20% dirty trigger).</p><p>During high-volume ingestion or unindexed update bursts, dirty page accumulation outpaces the background eviction threads. Once dirty pages cross the critical trigger threshold (default 20%), WiredTiger forces application worker threads to perform synchronous in-line page eviction. This triggers severe lock contention, thread starvation, client timeouts, and catastrophic checkpoint stalls that freeze all active read/write operations.</p>",
    "root_cause": "Write throughput exceeds disk I/O flush capacity, causing dirty cache pages to breach eviction_dirty_trigger thresholds and forcing user-facing client threads into synchronous page reconciliation.",
    "bad_code": "# Default / Sub-optimal mongod.conf under heavy write load\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      # Insufficient cache size and default uncalibrated eviction trigger thresholds\n      cacheSizeGB: 4\n# Under high concurrency, worker threads become blocked performing synchronous flush",
    "solution_desc": "Allocate appropriate cache sizing based on hardware memory, scale up background eviction worker threads via wiredTigerEngineRuntimeConfig, and lower the dirty page eviction target and trigger percentages to force smooth, early asynchronous flushes.",
    "good_code": "# Tuned mongod.conf for write-heavy workloads\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      # Configure aggressive background eviction before application threads stall\n      configString: >-\n        eviction=(threads_min=4,threads_max=8),\n        eviction_dirty_target=5,\n        eviction_dirty_trigger=15,\n        eviction_target=75,\n        eviction_trigger=90\nsystemLog:\n  destination: file\n  path: /var/log/mongodb/mongod.log\n  logAppend: true",
    "verification": "Run `db.serverStatus().wiredTiger.cache` periodically during benchmark ingestion; confirm `tracked dirty pages in the cache that can be written by client threads` equals 0 and background eviction handles all writes.",
    "date": "2026-09-26",
    "id": 1790429383,
    "type": "error"
});