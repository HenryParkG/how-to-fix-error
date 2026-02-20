window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Go",
    "code": "CACHE_STALL",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine uses a cache to manage data pages. Under heavy write pressure, the percentage of 'dirty' pages can exceed the eviction trigger. When this happens, WiredTiger forces application threads to assist with eviction, leading to massive latency spikes (stalls). This is often misdiagnosed as disk I/O bottlenecks when it is actually a cache tuning issue.</p>",
    "root_cause": "The rate of data ingress exceeds the capacity of background eviction threads, triggering application-level stalls.",
    "bad_code": "// Default config allows dirty pages to reach 20% before aggressive eviction\nstorage.wiredTiger.engineConfig.configString: \"\"\n// Application side doesn't account for backpressure",
    "solution_desc": "Lower the eviction triggers and targets to start background eviction earlier, ensuring that dirty pages never reach the threshold that triggers application-level stalls.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction_target=70,eviction_trigger=80,eviction_dirty_target=5,eviction_dirty_trigger=10\"\n})",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric using mongostat or Atlas metrics.",
    "date": "2026-02-20",
    "id": 1771562603,
    "type": "error"
});