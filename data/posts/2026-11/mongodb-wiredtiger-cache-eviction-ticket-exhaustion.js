window.onPostDataLoaded({
    "title": "Fix MongoDB WiredTiger Eviction Stalls & Read Tickets",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-exhaustion",
    "language": "SQL",
    "code": "TICKETS_EXHAUSTED",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "SQL",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger controls concurrent execution using read and write tickets (defaulting to 128 each). When application queries request data, MongoDB checks its internal cache; if cache misses occur or unindexed range scans force massive disk reads, the engine demands available read tickets to bring pages into memory.</p><p>If dirty page ratios exceed the configured eviction thresholds (typically 20% dirty or 80% total cache capacity), background eviction worker threads become overwhelmed. When this happens, WiredTiger forces user application threads to perform synchronous page eviction. These client threads forfeit their operational role to write dirty pages to disk, causing active read tickets to plunge to 0, queuing client requests and triggering massive system-wide latency spikes.</p>",
    "root_cause": "Unindexed table scans and bursty updates generating dirty cache pages faster than background threads can evict them, forcing user threads into synchronous cache eviction and consuming all concurrent read tickets.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      # Incorrect: sets cache to 95% of host RAM, starving OS page cache\n      cacheSizeGB: 60\n\n# Problematic application query running against an unindexed collection:\n# Forces full collection scan, polluting WiredTiger cache and exhausting read tickets\n# db.events.find({ \"metadata.processed\": false, \"timestamp\": { $lt: ISODate(\"2026-03-01\") } }).sort({ priority: -1 })",
    "solution_desc": "Cap wiredTigerEngineCacheSizeGB to 50-60% of total system RAM to ensure the OS filesystem page cache has sufficient room for compressed I/O. Tune WiredTiger internal eviction thread counts to ensure background workers keep dirty cache below thresholds, and enforce strict compound indexes to eliminate full-collection memory scans.",
    "good_code": "storage:\n  wiredTiger:\n    engineConfig:\n      # Safe allocation for a 64GB host: leaves ~30GB for OS cache, queries & buffers\n      cacheSizeGB: 34\n      configString: \"eviction=(threads_min=4,threads_max=8),eviction_target=75,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15\"\n\n# Add targeted compound index to satisfy queries directly from index keys:\n# db.events.createIndex({ \"metadata.processed\": 1, \"timestamp\": 1, \"priority\": -1 })",
    "verification": "Execute `db.serverStatus().wiredTiger.concurrentTransactions` and confirm that `read.available` remains consistently above 100. Check `wiredTiger.cache[\"tracked dirty bytes in the cache\"]` to ensure dirty page metrics stay well below `eviction_dirty_trigger` under peak write loads.",
    "date": "2026-11-09",
    "id": 1794196215,
    "type": "error"
});