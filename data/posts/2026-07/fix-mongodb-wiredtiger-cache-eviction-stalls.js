window.onPostDataLoaded({
    "title": "Fix MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "fix-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "CacheEvictionStall",
    "tags": [
        "Docker",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Under severe high-throughput write bursts, MongoDB's storage engine (WiredTiger) can experience eviction stalls when dirty data accumulation exceeds specified operational thresholds. When dirty pages exceed 20% of the allocated cache size, background eviction threads fall behind, forcing standard application worker threads to perform dirty page eviction directly. This results in severe latency spikes, client socket timeouts, and complete database stalls during sustained write operations.</p>",
    "root_cause": "Inadequate background eviction thread configuration and misconfigured dirty memory parameters during high write IOPS bursts.",
    "bad_code": "# Default / Flawed mongod.conf settings under high burst loads\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 4 # Fixed small cache on high-throughput node\n# Lacks evicted dirty target tuning, forcing app threads to handle memory eviction",
    "solution_desc": "Optimize WiredTiger cache allocation dynamically, increase background eviction threads, and adjust dirty percentage targets (`eviction_dirty_target` and `eviction_dirty_trigger`) so background threads aggressively evict memory before application threads freeze.",
    "good_code": "# Optimized mongod.conf\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=5,eviction_dirty_trigger=15\"\n\n# Dynamic runtime fix command via Mongo Shell:\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction_dirty_target=5,eviction_dirty_trigger=15\"\n});",
    "verification": "Monitor system metrics using `db.serverStatus().wiredTiger.cache` and ensure `tracked dirty bytes in the cache` remains below `eviction_dirty_trigger` threshold under peak synthetic write tests.",
    "date": "2026-07-30",
    "id": 1785389489,
    "type": "error"
});