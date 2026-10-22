window.onPostDataLoaded({
    "title": "Mitigate MongoDB WiredTiger Eviction Stalls on Updates",
    "slug": "fix-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Docker",
    "code": "WT_CACHE_FULL",
    "tags": [
        "Docker",
        "Python",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput, random update workloads that span working sets substantially larger than available RAM can trigger severe performance degradation in MongoDB's WiredTiger storage engine. When random updates modify disparate B-tree leaf pages, WiredTiger marks those pages as 'dirty'. WiredTiger relies on dedicated background eviction worker threads to compress and flush dirty pages to disk.</p><p>When the dirty page ratio in the cache crosses configured thresholds (defaulting to 20%), WiredTiger forces incoming application worker threads to transition into client-side eviction workers. When client application threads perform disk flushing inline, application write latency spikes exponentially from sub-millisecond rates to multiple seconds, causing connection pool exhaustion and cascading service timeouts across upstream microservices.</p>",
    "root_cause": "High-entropy random writes dirty B-tree leaf pages faster than default background eviction threads can serialize them, causing dirty cache saturation that forces synchronous client-thread eviction.",
    "bad_code": "# Problematic docker-compose.yml running MongoDB with stock WiredTiger limits\nversion: '3.8'\nservices:\n  mongo:\n    image: mongo:7.0\n    ports:\n      - \"27017:27017\"\n    deploy:\n      resources:\n        limits:\n          memory: 16G\n    command: [\"mongod\", \"--bind_ip_all\"]\n",
    "solution_desc": "Rebalance WiredTiger's cache dynamics by provisioning dedicated background eviction worker threads, lowering dirty eviction trigger thresholds to begin background page flushes earlier, and constraining client write concurrency using connection-level rate limiting.",
    "good_code": "# Production mongod.conf optimized for random write workloads\nstorage:\n  dbPath: /data/db\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 10\n      configString: >\n        eviction=(threads_min=4,threads_max=12),\n        eviction_dirty_target=5,\n        eviction_dirty_trigger=15,\n        eviction_target=75,\n        eviction_trigger=90\nnet:\n  maxIncomingConnections: 1000\n",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` in mongosh and monitor `\"pages dirty current\"` alongside `\"pages evicted by application threads\"`. Successful mitigation shows application thread evictions flatlining at 0 while background workers sustain flush rates.",
    "date": "2026-10-22",
    "id": 1792636424,
    "type": "error"
});