window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-stalls-dirty-pages",
    "language": "MongoDB",
    "code": "EvictionStall",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "SQL",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine manages memory using an in-memory page cache. When high write volumes generate modified ('dirty') pages faster than background WiredTiger eviction threads can write them to disk, the ratio of dirty memory in the cache spikes past safety thresholds.</p><p>When dirty cache usage breaches critical limits (default 20%), WiredTiger stops relying solely on background eviction threads and forces application worker threads to perform page eviction inline. This causes sudden query latency spikes, application execution stalls, and severe degradation of connection pools.</p>",
    "root_cause": "Default WiredTiger eviction thresholds allow too much dirty data to accumulate before background eviction worker threads reach maximum capacity, causing application threads to stall.",
    "bad_code": "# mongod.conf default configuration under heavy write ingestion\nstorage:\n  dbPath: /var/lib/mongodb\n  engine: wiredTiger\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      # Lack of background eviction tuning allows dirty pages to exceed 20%",
    "solution_desc": "Configure dynamic WiredTiger parameters to trigger background eviction earlier, lower the dirty page threshold at which eviction begins, and scale the maximum number of background eviction threads to prevent application thread involvement.",
    "good_code": "# Optimized mongod.conf settings\nstorage:\n  dbPath: /var/lib/mongodb\n  engine: wiredTiger\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=3,eviction_dirty_trigger=8\"\n\n# Dynamic admin command (applies instantly without database restart):\n# db.adminCommand({ setParameter: 1, wiredTigerEngineRuntimeConfig: \"eviction_dirty_target=3,eviction_dirty_trigger=8,eviction=(threads_max=12)\" });",
    "verification": "Run `db.serverStatus().wiredTiger.cache` in the MongoDB shell and ensure the metric `tracked dirty bytes in the cache` stays below 5% and `app thread eviction calls` remains strictly at zero during peak write loads.",
    "date": "2026-08-03",
    "id": 1785759174,
    "type": "error"
});