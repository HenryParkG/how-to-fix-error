window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "CacheStall",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger is MongoDB's default storage engine. It uses an internal cache to manage data pages. Under heavy write pressure, if the rate of incoming writes exceeds the rate at which the eviction server can push 'dirty' pages to disk, the database enters a 'stall' state. In this state, client threads are forced to participate in eviction, leading to a massive spike in latency and a drop in throughput.</p><p>This is common in write-intensive workloads where the disk I/O cannot keep up with the memory buffer updates.</p>",
    "root_cause": "The eviction server cannot keep the dirty cache percentage below the `eviction_trigger` (default 80% total/20% dirty). Once the dirty cache hits 20%, WiredTiger throttles application threads to prevent the cache from filling completely.",
    "bad_code": "# Default settings often fail on high-write IOPS-limited nodes\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Just setting size isn't enough",
    "solution_desc": "The fix involves aggressive tuning of WiredTiger's eviction parameters. Lowering the `eviction_target` and `eviction_trigger` forces the background threads to start working earlier, preventing the cache from reaching the 'critical' thresholds that trigger application-thread stalls.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=60,eviction_trigger=70,eviction_dirty_target=5,eviction_dirty_trigger=10,eviction_threads_min=4,eviction_threads_max=8\"\n})",
    "verification": "Check 'mongostat' or 'serverStatus'. Look for `wiredTiger.cache.tracked dirty bytes in the cache`. It should stay consistently below 10% without spikes in 'application threads paged in' metrics.",
    "date": "2026-04-15",
    "id": 1776216474,
    "type": "error"
});