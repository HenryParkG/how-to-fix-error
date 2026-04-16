window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-fix",
    "language": "NoSQL / Engine",
    "code": "WTCacheStall",
    "tags": [
        "SQL",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency write environments, MongoDB's WiredTiger storage engine can experience 'eviction stalls'. This happens when the dirty data in the cache grows faster than the background eviction threads can clear it. Once the dirty cache reaches a specific threshold (default 20%), WiredTiger forces application threads to perform eviction tasks, significantly increasing latency and throughput variability.</p>",
    "root_cause": "High-write saturation exceeding the default background eviction thread capacity, causing 'application thread eviction' where every write operation is blocked by its own necessary cleanup.",
    "bad_code": "# Default configuration often insufficient for NVMe/High-IOPS nodes\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# No custom eviction tuning present",
    "solution_desc": "Aggressively tune the WiredTiger eviction parameters to start background cleanup earlier. Lowering the eviction_trigger and increasing the number of eviction threads prevents application threads from being hijacked for system maintenance.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=80,eviction_target=70,eviction_dirty_trigger=10,eviction_dirty_target=5,eviction_threads_min=4,eviction_threads_max=8\"\n})",
    "verification": "Check `db.serverStatus().wiredTiger.cache` for 'application threads page read/write' metrics. These values should remain near zero after tuning under the same write load.",
    "date": "2026-04-16",
    "id": 1776324020,
    "type": "error"
});