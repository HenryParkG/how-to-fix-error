window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-stalls",
    "language": "SQL",
    "code": "CacheEvictionStall",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy sharded clusters, MongoDB's WiredTiger engine can experience 'eviction stalls'. This occurs when the cache is so full of 'dirty' (unwritten) data that it forces application threads to perform the eviction themselves. During this period, write throughput drops to near zero and latency spikes. This is usually triggered when the dirty page percentage exceeds the eviction_trigger threshold, often caused by slow disk I/O or inadequate cache sizing.</p>",
    "root_cause": "The rate of data ingestion exceeds the WiredTiger background threads' ability to reconcile and write pages to the filesystem.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Too small for 100k+ ops/sec",
    "solution_desc": "Aggressively tune the WiredTiger eviction parameters to start clearing dirty pages earlier and increase the number of worker threads dedicated to eviction.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=85,eviction_dirty_target=5,eviction_dirty_trigger=15,eviction=(threads_min=4,threads_max=12)\"\n})",
    "verification": "Monitor the 'wiredTiger.cache.pages_evicted_by_application_threads' metric; it should remain at zero in a healthy cluster.",
    "date": "2026-03-06",
    "id": 1772779012,
    "type": "error"
});