window.onPostDataLoaded({
    "title": "Fix MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "CacheEvictionStall",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine uses an internal cache to manage data pages. During heavy bulk writes, the cache fills up rapidly. If the background eviction threads cannot keep up with the incoming data, WiredTiger enters a 'stalling' state where application threads (the ones performing the writes) are forced to assist in page eviction.</p><p>This causes a massive spike in write latency (often jumping from 1ms to 1000ms+) because the threads meant for inserting data are now performing complex I/O operations to free up cache space. This is often visible in 'mongostat' as a surge in 'dirty' cache percentage and a drop in throughput.</p>",
    "root_cause": "The write rate exceeds the 'eviction_trigger' threshold, forcing synchronous eviction by application threads.",
    "bad_code": "// Standard connection without flow control or cache tuning\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 1 # Too small for high-velocity bulk writes",
    "solution_desc": "Increase the number of WiredTiger eviction threads and tune the eviction thresholds. Additionally, implement client-side rate limiting or enable 'flow control' in MongoDB 4.2+ to prevent the cache from reaching critical dirty levels.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=4,threads_max=8)\",\n  wiredTigerConcurrentWriteTransactions: 128\n});\n// In mongod.conf, ensure cacheSizeGB is at least 50-60% of RAM.",
    "verification": "Monitor 'wiredTiger.cache.tracked dirty pages in the cache' using db.serverStatus(). Ensure the percentage stays below the 20% default threshold during bulk operations.",
    "date": "2026-03-20",
    "id": 1773981768,
    "type": "error"
});