window.onPostDataLoaded({
    "title": "Resolving MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Go",
    "code": "Cache Stall",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger, MongoDB's storage engine, uses an internal cache to manage disk I/O. Under heavy write pressure, the percentage of 'dirty' pages (modified pages not yet written to disk) increases. If this exceeds the 'eviction_trigger' (default 80%), MongoDB forces application threads to participate in page eviction. This results in massive latency spikes, as operations that usually take milliseconds are blocked while the thread performs disk I/O to clear cache space.</p>",
    "root_cause": "The write rate exceeding the eviction throughput, causing the internal cache to reach its dirty page limit and triggering foreground thread stalls.",
    "bad_code": "// Standard connection string with no storage tuning\nmongod --dbpath /data/db --wiredTigerCacheSizeGB 4",
    "solution_desc": "To fix this, you must tune the WiredTiger engine to be more aggressive with background eviction. Decrease the 'eviction_trigger' and 'eviction_target' percentages so the background threads start working sooner, and increase the number of worker threads to match the available I/O bandwidth of the underlying storage.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=8),eviction_trigger=70,eviction_target=60\"\n});",
    "verification": "Check 'db.serverStatus().wiredTiger.cache' for the metric 'pages evicted by application threads'. It should be zero.",
    "date": "2026-05-02",
    "id": 1777715666,
    "type": "error"
});