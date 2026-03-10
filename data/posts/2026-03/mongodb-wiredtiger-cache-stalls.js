window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-stalls",
    "language": "Go / SQL",
    "code": "WT_CACHE_FULL",
    "tags": [
        "MongoDB",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger is the default storage engine for MongoDB. Under heavy write pressure, the internal cache fills up with 'dirty' pages. When the cache pressure hits the eviction trigger (default 80%), application threads are forced to help with eviction (page write-out to disk), leading to massive latency spikes and throughput drops.</p><p>This is often seen in high-volume logging or IoT data ingestion platforms where the disk I/O cannot keep up with the memory buffer's growth.</p>",
    "root_cause": "The rate of data modification (dirty page creation) exceeds the capability of background eviction threads to move data to disk, causing the 'eviction_trigger' to force application threads into synchronous disk I/O.",
    "bad_code": "db.adminCommand({ \n  setParameter: 1, \n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=95,eviction_target=80\"\n}); // Too high, risks sudden application stalls",
    "solution_desc": "Proactively lower the eviction triggers to start background eviction earlier. This ensures that the cache has enough 'clean' space to absorb bursts. Tuning 'eviction_dirty_trigger' and 'eviction_dirty_target' is more effective than increasing cache size alone.",
    "good_code": "db.adminCommand({ \n  setParameter: 1, \n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=80,eviction_target=70,eviction_dirty_trigger=5,eviction_dirty_target=3\"\n});",
    "verification": "Monitor the 'wiredtiger.cache.tracked dirty bytes in the cache' metric. If it stays consistently below 5% while throughput is high, the stall risk is mitigated.",
    "date": "2026-03-10",
    "id": 1773124689,
    "type": "error"
});