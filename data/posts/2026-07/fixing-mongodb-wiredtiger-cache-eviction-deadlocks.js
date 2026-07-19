window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Deadlocks",
    "slug": "fixing-mongodb-wiredtiger-cache-eviction-deadlocks",
    "language": "C++",
    "code": "Cache Eviction Deadlock",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, relies on an in-memory cache to manage read/write operations before persisting pages to disk. Under heavy write-intensive workloads, if the proportion of modified (dirty) pages in the cache grows faster than the background eviction threads can write them to disk, WiredTiger reaches a critical threshold (typically 20% dirty data).</p><p>When this limit is exceeded, user client application threads are co-opted to perform raw page eviction to prevent out-of-memory crashes. However, if these user threads hold transactional locks or latches while attempting to evict other pages, they can become deadlocked or severely stalled waiting for background reconciliation processes, grinding write operations to a complete halt.</p>",
    "root_cause": "High volume concurrent writes exhaust the background WiredTiger eviction worker pool, forcing application client threads to perform synchronous page eviction while holding internal transaction state.",
    "bad_code": "# Default mongod.conf under heavy concurrent write loads\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      # Relying entirely on default internal eviction triggers without limits\n      cacheSizeGB: 8",
    "solution_desc": "To resolve this deadlock, dynamically configure WiredTiger's internal eviction settings to increase the background worker thread pool size, aggressively lower the dirty page threshold at which background eviction starts, and limit the maximum percentage of dirty data allowed before user threads are forced to assist.",
    "good_code": "# Optimized mongod.conf for write-intensive environments\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: >\n        eviction=(threads_min=4,threads_max=12),\n        eviction_dirty_trigger=5,\n        eviction_dirty_target=3,\n        eviction_trigger=95,\n        eviction_target=80",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` in the MongoDB shell. Check the output fields `tracked dirty bytes in the cache` (which should remain stably below the 5% threshold) and verify that `eviction worker thread evictions` is handling the bulk of the eviction load compared to `application thread evictions`.",
    "date": "2026-07-19",
    "id": 1784439738,
    "type": "error"
});