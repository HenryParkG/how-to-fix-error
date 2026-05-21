window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "WT_CACHE_FULL (Stall)",
    "tags": [
        "SQL",
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy MongoDB deployment environments, applications can experience abrupt, severe latency spikes (sometimes called application stalls) where write operations jump from sub-millisecond durations to tens of seconds. This degradation occurs when the WiredTiger storage engine's cache eviction mechanism fails to keep pace with incoming writes. WiredTiger manages a dedicated cache pool where dirty pages (modified data in memory) are continuously flushed to disk by background threads.</p><p>By default, when the percentage of dirty pages in the WiredTiger cache hits 20%, or when the total cache utilization reaches 95%, MongoDB switches from asynchronous background eviction to aggressive, synchronous in-line eviction. Under this 'cache pressure' state, application threads that submit write operations are hijacked by WiredTiger and forced to perform write-to-disk operations themselves to free up cache space. This creates a cascade effect of high context switching, saturated disk I/O, and massive query queues.</p>",
    "root_cause": "Under-provisioned background eviction threads and low default threshold configuration in MongoDB under high-throughput writes. When disk I/O cannot absorb the raw write volume, the dirty page ratio crosses the 20% limit, forcing concurrent client connections to perform disk serialization sequentially.",
    "bad_code": "# BUG: Default Docker / standard configuration file with low memory limit\n# and unoptimized default WiredTiger eviction settings under write-intensive stress.\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 2 # Artificially low cache for high-throughput container limits\n# Lacks configuration tuning for eviction threads and targets.",
    "solution_desc": "To mitigate eviction stalls, the WiredTiger configuration must be tuned via 'wiredTiger.engineConfig.configString' to increase the number of concurrent eviction workers. Furthermore, we should adjust the threshold parameters to begin eviction much earlier, preventing dirty pages from hitting the 20% critical boundary. Providing appropriate hardware provisioned IOPS (input/output operations per second) and setting the cacheSizeGB to 50-60% of available system memory is also required.",
    "good_code": "# Optimized MongoDB Configuration for high write environments\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Correctly scaled to 60% of a 24GB system RAM\n      configString: >\n        eviction_workers_min=4,\n        eviction_workers_max=16,\n        eviction_trigger=85,\n        eviction_target=75,\n        eviction_dirty_trigger=5,\n        eviction_dirty_target=3\n# Explanation:\n# eviction_dirty_trigger=5: Starts background eviction when dirty data reaches 5%\n# eviction_dirty_target=3: Background threads work to keep dirty data under 3%\n# eviction_workers_max=16: Scales eviction threads dynamically to keep up with writes",
    "verification": "Run 'db.serverStatus().wiredTiger.cache' in the mongo shell. Monitor the metric 'tracked dirty bytes in the cache' and ensure it remains consistently below the 'eviction_dirty_trigger' percentage, and verify that the count of 'pages evicted by application threads' remains near zero.",
    "date": "2026-05-21",
    "id": 1779330555,
    "type": "error"
});