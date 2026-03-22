window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Contention",
    "slug": "mongodb-wiredtiger-cache-eviction-fix",
    "language": "MongoDB",
    "code": "CacheContention",
    "tags": [
        "Docker",
        "NoSQL",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>In high-write MongoDB clusters, application performance can degrade sharply when the WiredTiger cache eviction mechanism cannot keep up with incoming data. This leads to 'eviction contention' where application threads are forced to perform their own evictions, causing massive latency spikes (stall) in write operations.</p>",
    "root_cause": "The default eviction_dirty_trigger (20%) and eviction_trigger (80%) are too loose for high-speed NVMe storage, allowing cache pressure to build too quickly.",
    "bad_code": "// Standard WiredTiger Config\nstorage.wiredTiger.engineConfig.configString: \"\"\n// Application experiences high 'cache_eviction_app' metrics",
    "solution_desc": "Lower the eviction triggers to start the background eviction process earlier, preventing the cache from reaching a critical state where application threads are hijacked.",
    "good_code": "storage:\n  wiredTiger:\n    engineConfig:\n      configString: \"eviction_dirty_trigger=5,eviction_dirty_target=1,eviction_trigger=60,eviction_target=50\"",
    "verification": "Run 'db.serverStatus().wiredTiger.cache' and verify that 'extra worker threads created' and 'application threads page read/write' metrics decrease.",
    "date": "2026-03-22",
    "id": 1774171459,
    "type": "error"
});