window.onPostDataLoaded({
    "title": "Resolving WiredTiger Cache Contention in MongoDB",
    "slug": "mongodb-wiredtiger-cache-fix",
    "language": "Python",
    "code": "WT_CACHE_FULL",
    "tags": [
        "SQL",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger cache eviction contention occurs when the rate of incoming writes exceeds the eviction threads' ability to free up space. In high-throughput MongoDB clusters, this results in application threads being forced to perform 'page-in' or 'eviction' tasks, adding hundreds of milliseconds to simple CRUD operations.</p>",
    "root_cause": "Default WiredTiger settings (eviction_target: 80%, eviction_trigger: 95%) are too wide for high-RAM instances, leading to explosive growth of dirty pages.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 32\n# Default eviction settings are implicit and often fail under load",
    "solution_desc": "Lower the eviction thresholds and increase the number of eviction worker threads. This forces the engine to start cleaning the cache earlier and more aggressively before the 'trigger' point is reached.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=85,eviction_dirty_target=5,eviction_dirty_trigger=15,threads_min=4,threads_max=12\"\n})",
    "verification": "Check 'mongostat' for the 'dirty' percentage and ensure it stays below 15% even during peak write traffic.",
    "date": "2026-04-12",
    "id": 1775971017,
    "type": "error"
});