window.onPostDataLoaded({
    "title": "MongoDB: WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-fix",
    "language": "SQL",
    "code": "CacheStall",
    "tags": [
        "SQL",
        "Infra",
        "MongoDB",
        "Error Fix"
    ],
    "analysis": "<p>Under heavy write pressure, MongoDB performance can plummet due to WiredTiger cache eviction stalls. When the percentage of 'dirty' data in the cache exceeds specific thresholds, WiredTiger forces application threads to perform eviction themselves, leading to massive latency spikes and throughput drops.</p>",
    "root_cause": "The rate of incoming writes exceeds the background eviction threads' ability to persist data to disk, causing the 'eviction_dirty_trigger' (default 20%) to be hit.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# No custom eviction tuning for high-throughput write workloads",
    "solution_desc": "Increase the number of eviction worker threads and lower the 'eviction_trigger' to start background eviction earlier. Also, ensure disk I/O bandwidth matches the write volume to prevent the eviction queue from backing up.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_threads_min=4,eviction_threads_max=12,eviction_dirty_target=5,eviction_dirty_trigger=10\"\n})",
    "verification": "Monitor 'wiredTiger.cache.eviction walks abandoned' and 'cache dirty percentage' using 'db.serverStatus().wiredTiger.cache'.",
    "date": "2026-02-16",
    "id": 1771235201,
    "type": "error"
});