window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-stalls-fix",
    "language": "NoSQL/C++",
    "code": "Cache Eviction Stall",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine uses a cache to manage disk I/O. Under intense write pressure, the percentage of 'dirty' pages in the cache can exceed the <code>eviction_trigger</code>. When this happens, application threads are hijacked to perform 'dirty page eviction' (synchronous eviction), causing massive latency spikes or 'stalls'. This is common in cloud environments with high-speed NVMe drives where the default eviction worker count is insufficient to keep up with the write volume.</p>",
    "root_cause": "The default <code>wiredTiger</code> configuration allocates too few eviction threads, and the trigger for application-thread eviction is set too low for high-throughput write-heavy workloads.",
    "bad_code": "storage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default settings use 4 eviction threads, often causing stalls",
    "solution_desc": "Adjust the WiredTiger engine configuration strings to increase the number of concurrent eviction threads and lower the dirty page threshold where background eviction starts. This keeps the cache cleaner and prevents application threads from being blocked by I/O tasks.",
    "good_code": "storage:\n  wiredTiger:\n    engineConfig:\n      configString: \"eviction=(threads_min=4,threads_max=20),eviction_dirty_trigger=5,eviction_dirty_target=1\"\n      cacheSizeGB: 16",
    "verification": "Monitor the `wiredTiger.cache.force-yield-time-microseconds` metric via `db.serverStatus()`. A successful fix will show this value staying near zero even during write spikes.",
    "date": "2026-03-27",
    "id": 1774604848,
    "type": "error"
});