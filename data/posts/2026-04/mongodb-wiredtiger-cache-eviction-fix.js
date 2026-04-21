window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-fix",
    "language": "C++ / MongoDB",
    "code": "CacheStall",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Under heavy write concurrency, MongoDB instances may experience sudden latency spikes known as WiredTiger cache eviction stalls. This happens when the dirty data in the cache exceeds the 'eviction_trigger' threshold. When this occurs, application threads are forced to perform eviction themselves, effectively pausing write operations until the cache is cleared.</p>",
    "root_cause": "The default eviction settings are often too optimistic for high-throughput SSDs, causing dirty pages to accumulate faster than the background threads can flush them to disk.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default settings often fail under 10k+ OPS/sec",
    "solution_desc": "Lower the 'eviction_trigger' and 'eviction_target' percentages in the WiredTiger configuration. This forces background eviction to start earlier and work more aggressively, preventing application-thread interference.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=80,eviction_target=60,eviction_dirty_trigger=5,eviction_dirty_target=3\"\n})",
    "verification": "Monitor 'wiredTiger.cache.tracked dirty bytes in the cache' using mongostat to ensure it stays below the trigger threshold.",
    "date": "2026-04-21",
    "id": 1776766355,
    "type": "error"
});