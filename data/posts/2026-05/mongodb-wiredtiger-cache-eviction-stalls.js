window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Docker",
    "code": "WIREDTIGER_CACHE_STALL",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, holds raw and modified index/data pages inside an in-memory cache. During heavy write cycles, pages are continuously marked as dirty. Background threads continuously evict these pages in order to guarantee clean buffer allocations for future transactional modifications.</p><p>When the dirty data generation exceeds the capabilities of the background processes\u2014specifically crossing 20% of the entire cache\u2014the user thread transitions from doing active business logic writes to helping evict blocks from the cache. This cooperative eviction is catastrophic for latency, resulting in multi-second thread-lock stalls and immediate degradation of overall query processing.</p>",
    "root_cause": "The default configuration thresholds for WiredTiger's cache eviction criteria are too aggressive or too restrictive when run inside containers, especially when disk IO operations are throttled or storage size limits are not explicitly aligned with container limits.",
    "bad_code": "version: '3.8'\nservices:\n  mongodb:\n    image: mongo:6.0\n    # BUG: Running with default configurations, relying on self-tuning calculations\n    # inside environments without cgroup memory limit constraints, leading to OOM or cache stall.\n    ports:\n      - \"27017:27017\"\n    volumes:\n      - mongo_data:/data/db",
    "solution_desc": "Architecturally fine-tune WiredTiger cache sizes and customize background eviction configurations via custom startup configurations. Set limits based on the container container profile limit, adjust the eviction thread count, and optimize cache clean/dirty triggers to prevent client threads from stepping into cooperative eviction.",
    "good_code": "version: '3.8'\nservices:\n  mongodb:\n    image: mongo:6.0\n    # FIX: Explicitly constrain cache allocation to target cgroup limit,\n    # and configure aggressive background eviction parameters to clean memory early.\n    command: >\n      mongod --wiredTigerCacheSizeGB 4\n             --setParameter wiredTigerEngineRuntimeConfig=\"eviction_target=75,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_workers_min=4,eviction_workers_max=12\"\n    deploy:\n      resources:\n        limits:\n          memory: 8G\n    ports:\n      - \"27017:27017\"\n    volumes:\n      - mongo_data:/data/db",
    "verification": "Execute workload stress cycles with aggressive load generators. Query the engine using the MongoDB shell with `db.serverStatus().wiredTiger.cache` and monitor the statistics measuring `pages evicted by connection workers` vs `pages evicted by eviction workers` to confirm that client workers are not contributing to eviction.",
    "date": "2026-05-30",
    "id": 1780121754,
    "type": "error"
});