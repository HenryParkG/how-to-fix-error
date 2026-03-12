window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-eviction-stalls",
    "language": "Go",
    "code": "CacheEvictionTimeout",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger engine can experience 'eviction stalls' when the volume of dirty data exceeds configured thresholds. Under heavy write pressure, the background eviction threads cannot keep up, forcing application threads to participate in eviction (page-trapping). This leads to massive latency spikes and throughput collapse. This typically happens when the Oplog or heavy updates saturate the cache faster than the disk subsystem can flush pages.</p>",
    "root_cause": "The write rate exceeds the eviction rate, causing the 'eviction_trigger' (default 95% of cache) to be hit, which blocks user operations to perform emergency eviction.",
    "bad_code": "storage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default settings often fail under 50k+ write ops/sec\n# as they allow too much dirty data to accumulate.",
    "solution_desc": "Lower the eviction thresholds to start background eviction earlier. Tuning 'eviction_trigger' and 'eviction_dirty_trigger' ensures the engine stays ahead of the write load without involving user threads.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=80,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=10\"\n});\n// Also increase eviction worker threads if CPU allows:\n// \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=12)\"",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric using mongostat. Ensure it stays below the eviction_dirty_trigger and check for 'eviction server gave up' messages in logs.",
    "date": "2026-03-12",
    "id": 1773277712,
    "type": "error"
});