window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Go",
    "code": "Cache Eviction Stall / Write Block",
    "tags": [
        "Docker",
        "MongoDB",
        "NoSQL",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB deployments subject to high-velocity, concurrent write operations can experience catastrophic throughput degradation, characterized by execution latency spikes scaling from milliseconds to dozens of seconds. This state is known as a cache eviction stall.</p><p>By default, MongoDB's WiredTiger storage engine relies on background threads to evict dirty data pages from the cache to disk. When the volume of dirty pages exceeds the maximum dirty threshold, application client threads are hijacked to assist with eviction. This blocks the client threads, leading to a cascading failure of connection pool exhaustion and application-wide timeouts.</p>",
    "root_cause": "The default WiredTiger configuration triggers application-assisted eviction once dirty cache usage crosses 20% of the allocated size. Under high-velocity concurrent writes, background eviction workers cannot flush data fast enough, forcing client connections to perform disk I/O inline and halting transaction pipelines.",
    "bad_code": "systemLog:\n  destination: file\n  path: /var/log/mongodb/mongod.log\n  logAppend: true\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      # Default cache eviction settings often fail under parallel write loads\n      cacheSizeGB: 16",
    "solution_desc": "Modify the WiredTiger engine configuration to allocate more background eviction threads, lower the threshold at which background eviction starts, and trigger aggressive flushing before application threads are forced to cooperate. This ensures that application client threads remain dedicated entirely to executing database operations.",
    "good_code": "storage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: >\n        eviction_workers_min=4,\n        eviction_workers_max=16,\n        eviction_target=75,\n        eviction_trigger=95,\n        eviction_dirty_target=5,\n        eviction_dirty_trigger=15",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` and monitor the fields `tracked dirty bytes in the cache` and `eviction worker thread evicting pages`. Confirm that the metric `application threads page eviction` remains at zero during peak write loads.",
    "date": "2026-05-23",
    "id": 1779515978,
    "type": "error"
});