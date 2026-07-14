window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "fixing-wiredtiger-cache-eviction-stalls-mongodb",
    "language": "Go",
    "code": "WT Cache Stall",
    "tags": [
        "SQL",
        "Go",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>During write-heavy ingestion workloads, MongoDB performance drops off a cliff as operations freeze due to WiredTiger cache eviction stalls. This issue occurs when the rate of incoming dirty data exceeds the background engine's capacity to evict pages to disk. When the cache dirty bytes percentage hits a hard limit, application threads are forcibly diverted from database writes to execute synchronous page-outs, causing severe application latency spikes.</p>",
    "root_cause": "The default WiredTiger configuration triggers background thread eviction too late. When dirty pages exceed critical thresholds, MongoDB forces client connection threads to handle page eviction directly, blocking writes and triggering driver timeouts.",
    "bad_code": "// Default runtime settings without explicit eviction parameter overrides\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction_target=80,eviction_trigger=95\"\n});",
    "solution_desc": "Reconfigure the WiredTiger engine runtime to begin background cache eviction much earlier and increase the number of worker threads to continuously write dirty pages to disk, keeping the dirty cache ratio well below the hard synchronous-eviction threshold.",
    "good_code": "// Tuning background eviction to start earlier and use more background threads\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=4,threads_max=8),eviction_dirty_target=5,eviction_dirty_trigger=10\"\n});",
    "verification": "Run 'db.serverStatus().wiredTiger.cache' during high-throughput ingestion and verify that 'tracked dirty bytes in the cache' stays below 10%, and 'eviction state table: hazard pointer blocked page evictions' remains at zero.",
    "date": "2026-07-14",
    "id": 1784006516,
    "type": "error"
});