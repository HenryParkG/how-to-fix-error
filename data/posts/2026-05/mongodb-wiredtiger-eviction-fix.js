window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-fix",
    "language": "SQL",
    "code": "CacheStall",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger engine uses a ticket-based system for concurrency. When the 'dirty' data in the cache exceeds 20% (default), or total cache pressure exceeds 95%, WiredTiger enters 'forced eviction' mode. In this state, user threads are hijacked to perform disk I/O, causing application-level latency to spike from milliseconds to seconds.</p><p>This usually happens during heavy write bursts that exceed the underlying storage's IOPS capacity.</p>",
    "root_cause": "Application write throughput exceeding the disk's ability to flush the WiredTiger cache, leading to dirty page accumulation.",
    "bad_code": "// Running with default settings on slow EBS volumes\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 1 // Too small for heavy workloads",
    "solution_desc": "Adjust the WiredTiger eviction thresholds to start background eviction earlier (e.g., at 5% dirty) and increase the number of eviction threads to prevent user threads from being co-opted.",
    "good_code": "// Apply via mongo shell or config file\ndb.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=10,eviction_target=5,eviction_dirty_trigger=5,eviction_dirty_target=3\"\n})\n// Also ensure storage.wiredTiger.engineConfig.cacheSizeGB is 50-60% of RAM.",
    "verification": "Check 'mongostat' or 'db.serverStatus().wiredTiger.cache'. 'tracked dirty pages in the cache' should stay below the 'eviction_dirty_trigger' value.",
    "date": "2026-05-19",
    "id": 1779157724,
    "type": "error"
});