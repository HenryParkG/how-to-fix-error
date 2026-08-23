window.onPostDataLoaded({
    "title": "Resolve WiredTiger Eviction Stalls & Lock Contention",
    "slug": "resolve-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "WT_CACHE_FULL",
    "tags": [
        "SQL",
        "MongoDB",
        "Database",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB deployments experiencing heavy write workloads often suffer from severe latency spikes and stalled client operations when WiredTiger's cache usage exceeds the dirty data eviction threshold (typically 20% by default) or total cache capacity (80%). When eviction workers cannot keep up with high ingestion throughput, incoming client application threads are forced to become emergency eviction workers, known as application-assisted eviction.</p><p>Simultaneously, regular checkpoint operations lock internal B-Tree metadata and force dirty pages to be flushed to disk, creating heavy disk I/O bottlenecks and lock contention that paralyze the storage engine.</p>",
    "root_cause": "High volume of in-flight uncommitted writes overwhelming the WiredTiger cache dirty page watermark, compounded by checkpoint intervals forcing large flush sizes over constrained disk bandwidth.",
    "bad_code": "# Default / Problematic mongod.conf settings under high IO load\nstorage:\n  dbPath: /data/db\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 1 # Inadequately sized cache on a high-memory box\n    collectionConfig:\n      blockCompressor: snappy\n# Missing explicit eviction and checkpoint tuning leading to default stall behavior",
    "solution_desc": "Tune WiredTiger cache eviction thresholds via `wiredTigerEngineRuntimeConfig`, allocate sufficient memory for the working set (50-60% of RAM), and optimize checkpoint frequency and background eviction worker threads.",
    "good_code": "# mongod.conf optimized configuration\nstorage:\n  dbPath: /data/db\n  syncPeriodSecs: 60 # Standardize checkpoint flush intervals\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Allocate ~50-60% of total host RAM\n      configString: \"eviction=(threads_min=4,threads_max=8),eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_target=75,eviction_trigger=90\"\n    collectionConfig:\n      blockCompressor: zstd # Higher compression efficiency\n\n# Dynamic adjustment via MongoDB Shell without restart:\n# db.adminCommand({ setParameter: 1, wiredTigerEngineRuntimeConfig: \"eviction_dirty_target=5,eviction_dirty_trigger=15\" })",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` and inspect `\"pages written from cache by application threads\"` (must remain near 0) and `\"tracked dirty bytes in the cache\"` to ensure dirty page metrics stay well below the trigger ceiling.",
    "date": "2026-08-23",
    "id": 1787456528,
    "type": "error"
});