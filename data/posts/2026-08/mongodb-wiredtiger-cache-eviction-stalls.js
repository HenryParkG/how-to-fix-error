window.onPostDataLoaded({
    "title": "Resolve WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Go",
    "code": "WT_CACHE_FULL",
    "tags": [
        "Go",
        "SQL",
        "Docker",
        "MongoDB",
        "Error Fix"
    ],
    "analysis": "<p>Under high-throughput write workloads with complex document updates, MongoDB instances running the WiredTiger storage engine can experience sudden latency spikes known as cache eviction stalls.</p><p>WiredTiger uses background worker threads to evict dirty pages from cache to disk. When the rate of dirty page generation exceeds the eviction capability, WiredTiger forces user/client application threads to assist in performing synchronous page eviction. During this period, incoming writes and reads are throttled, queue lengths skyrocket, and database operations hang.</p>",
    "root_cause": "The percentage of dirty cache pages exceeds `eviction_dirty_trigger` (default 20%) or total memory consumption crosses `eviction_trigger` (default 95%), forcing client application threads to synchronously flush pages to disk.",
    "bad_code": "# Default mongod.conf vulnerable to eviction stalls under heavy write spikes\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Missing custom eviction thread configuration and aggressive dirty thresholds",
    "solution_desc": "Tune WiredTiger cache thresholds using aggressive dirty target and trigger parameters, scale eviction worker threads, and rate-limit application batch writes to keep dirty memory well below synchronous eviction thresholds.",
    "good_code": "# mongod.conf - Tuned for high write concurrency\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 24\n      configString: >-\n        eviction_target=75,\n        eviction_trigger=90,\n        eviction_dirty_target=5,\n        eviction_dirty_trigger=15,\n        eviction=(threads_min=4,threads_max=12)\n\n# Dynamic runtime adjustment via Mongo shell:\n# db.adminCommand({ setParameter: 1, wiredTigerEngineRuntimeConfig: \"eviction_dirty_target=5,eviction_dirty_trigger=15\" })",
    "verification": "Inspect cache metrics via `db.serverStatus().wiredTiger.cache`. Confirm that `pages evicted by application threads` remains at 0 and `tracked dirty bytes in the cache` stays below 15% during peak write stress testing.",
    "date": "2026-08-14",
    "id": 1786669600,
    "type": "error"
});