window.onPostDataLoaded({
    "title": "Eliminating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "WiredTiger LRS Stall",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput MongoDB environments, write performance often degrades sharply when the WiredTiger cache becomes saturated. When the volume of dirty data exceeds the 20% threshold, WiredTiger forces application threads to participate in page eviction. This 'application-side eviction' causes massive latency spikes because threads intended for processing queries are diverted to disk I/O tasks. This feedback loop often leads to a complete 'stall' where no progress is made until the cache is cleared.</p>",
    "root_cause": "The storage engine's dirty data exceeds the 'eviction_trigger' threshold, forcing user threads to perform synchronous eviction instead of background threads handling it asynchronously.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default settings allow dirty data to reach 20% before aggressive eviction,\n# leading to massive latency spikes under 10k+ IOPS.",
    "solution_desc": "Architecturally, you must tune the WiredTiger eviction parameters to start background eviction much earlier. By lowering the eviction_trigger and increasing the number of eviction threads, the background process keeps the dirty cache low enough that user threads never have to pause for I/O operations.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=5,eviction_target=1,eviction_dirty_trigger=5,eviction_dirty_target=1,eviction_threads_min=4,eviction_threads_max=8\"\n});",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric. Ensure it remains below 5% consistently during peak write load.",
    "date": "2026-03-15",
    "id": 1773537927,
    "type": "error"
});