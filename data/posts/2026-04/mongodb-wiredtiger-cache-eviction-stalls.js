window.onPostDataLoaded({
    "title": "Resolving WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Go",
    "code": "WT_CACHE_STALL",
    "tags": [
        "SQL",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger engine uses a page-based cache to manage data. Under heavy write pressure, 'dirty' pages accumulate faster than the eviction threads can write them to disk. When the cache hits the 'dirty_trigger' (usually 20% of the cache size) or the 'eviction_trigger' (95%), all application threads are forced to participate in eviction.</p><p>This leads to massive latency spikes as the database effectively halts operations to clear memory, a phenomenon known as an eviction stall.</p>",
    "root_cause": "The write volume exceeds the underlying disk I/O bandwidth or the background eviction threads are under-provisioned relative to the total cache size.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Default on high-RAM host with no limit",
    "solution_desc": "Aggressively tune the WiredTiger eviction worker counts and lower the dirty trigger to start background eviction earlier, preventing application-level stalls.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_workers_min=4,eviction_workers_max=12\"\n})",
    "verification": "Monitor 'db.serverStatus().wiredTiger.cache[\"eviction calls yielding cpu\"]' and verify that 'dirty' bytes stay below the trigger threshold.",
    "date": "2026-04-07",
    "id": 1775538283,
    "type": "error"
});