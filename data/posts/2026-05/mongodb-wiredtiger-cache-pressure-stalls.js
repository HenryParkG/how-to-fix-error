window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Pressure Stalls",
    "slug": "mongodb-wiredtiger-cache-pressure-stalls",
    "language": "MongoDB",
    "code": "CacheStall",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy MongoDB clusters, the WiredTiger storage engine can experience 'cache pressure.' When the percentage of dirty pages in the WiredTiger cache exceeds the <code>eviction_trigger</code> (default 20%), WiredTiger begins application-thread eviction, which throttles client writes to allow the eviction server to catch up. This results in massive latency spikes and throughput drops.</p>",
    "root_cause": "High volume of random writes causing dirty pages to accumulate faster than the background eviction threads can flush them to disk, exceeding the 10% dirty page threshold for background eviction.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 1 # Too small for high-concurrency writes\n# No custom eviction tuning, default thresholds applied",
    "solution_desc": "Increase the WiredTiger cache size to accommodate the working set and tune the eviction thread count and dirty page triggers to start eviction earlier and more aggressively.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=8),eviction_dirty_trigger=5,eviction_dirty_target=3\"\n});\n// Also increase cacheSizeGB in mongod.conf to 50-60% of RAM",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric using mongostat or Cloud Manager. Ensure it stays below the eviction_trigger threshold.",
    "date": "2026-05-10",
    "id": 1778378436,
    "type": "error"
});