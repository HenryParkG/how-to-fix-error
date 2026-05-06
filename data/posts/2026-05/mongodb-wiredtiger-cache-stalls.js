window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-stalls",
    "language": "Node.js",
    "code": "CacheEvictionStall",
    "tags": [
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When MongoDB experiences a heavy write saturation, the WiredTiger storage engine must evict data from the cache to make room for new writes. If the rate of incoming writes exceeds the disk I/O's ability to flush 'dirty' pages, MongoDB forces application threads to assist in eviction, resulting in massive latency spikes (stalls) for every database operation.</p>",
    "root_cause": "WiredTiger's 'dirty' cache percentage exceeds the 'eviction_trigger' threshold (default 20%), causing the engine to throttle user threads to prevent memory exhaustion.",
    "bad_code": "// Rapid unthrottled bulk writes in Node.js\nasync function heavyLoad() {\n  for (let i = 0; i < 1000000; i++) {\n    db.collection('logs').insertOne({ data: largeBlob });\n  }\n}",
    "solution_desc": "Adjust WiredTiger eviction settings to start background eviction earlier and more aggressively. Additionally, implement application-level rate limiting and ensure the storage engine cache size is correctly tuned (50% of RAM - 1GB).",
    "good_code": "// Adjusting WiredTiger parameters via admin command\ndb.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=8),eviction_trigger=10,eviction_target=5\"\n});\n// Lowers trigger to 10% dirty to start background work sooner",
    "verification": "Check 'mongostat' for the 'dirty' column. If the percentage stays below the trigger point and 'app threads helping' count is zero, the stall is resolved.",
    "date": "2026-05-06",
    "id": 1778032718,
    "type": "error"
});