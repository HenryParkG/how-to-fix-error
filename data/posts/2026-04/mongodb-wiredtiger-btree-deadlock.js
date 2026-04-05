window.onPostDataLoaded({
    "title": "Mitigating B-Tree Node Split Deadlocks in WiredTiger",
    "slug": "mongodb-wiredtiger-btree-deadlock",
    "language": "SQL",
    "code": "DeadlockFound",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency MongoDB environments, the WiredTiger storage engine manages data using B-Trees. A deadlock can occur when multiple threads attempt to split or merge B-Tree nodes simultaneously. Thread A might lock a parent node and wait for a child node to be freed, while Thread B holds the child node and waits for a parent lock to propagate a split. This circular dependency stalls the eviction server and leads to 'WiredTiger Error (24)' or complete engine hangs under heavy write pressure.</p>",
    "root_cause": "Inversion of lock acquisition order during concurrent B-Tree rebalancing and cache eviction operations.",
    "bad_code": "// High write pressure scenario with default settings\n// mongo.conf\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 1\n# Risk: Small cache + high concurrency triggers frequent splits/evictions",
    "solution_desc": "Increase the 'eviction_trigger' and 'eviction_target' values to prevent the cache from reaching critical fullness too quickly. Additionally, implement application-side throttling or use hashed sharding to distribute write load and reduce hotspots on specific B-Tree branches.",
    "good_code": "// Optimized WiredTiger configuration\ndb.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=95,eviction_target=80,checkpoint_trigger=1000\"\n});",
    "verification": "Monitor 'wiredTiger.cache.eviction-walks-abandoned' in serverStatus. A decrease in abandoned walks indicates reduced contention.",
    "date": "2026-04-05",
    "id": 1775381582,
    "type": "error"
});