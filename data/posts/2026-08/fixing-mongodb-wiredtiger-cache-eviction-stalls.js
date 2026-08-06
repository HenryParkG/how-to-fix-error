window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "fixing-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB / WiredTiger",
    "code": "Read Ticket Exhaustion",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB databases under sustained high-throughput write/update workloads often experience sudden spikes in operation latency accompanied by application connection timeouts. Internal logs reveal 0 available read or write tickets under WiredTiger concurrency control metrics.</p><p>This occurs when the proportion of dirty pages in the WiredTiger memory cache exceeds critical thresholds (default `eviction_dirty_trigger` is 20%). When this happens, background eviction threads are unable to write dirty pages to disk fast enough. WiredTiger forces application worker threads to perform page eviction directly. These worker threads hold read/write tickets while performing disk I/O, rapidly exhausting available tickets and stalling all subsequent database operations.</p>",
    "root_cause": "Inadequate eviction configuration thresholds coupled with dirty page creation rates exceeding physical disk IOPS capacity, causing application threads to stall on eviction locks.",
    "bad_code": "# mongod.conf default settings under heavy write pressure\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      # Defaults allow dirty pages to accumulate up to 20% before emergency thread pinning occurs\n      # Missing custom eviction thread and dirty page tuning",
    "solution_desc": "Tune WiredTiger cache parameters in `mongod.conf` to start eviction earlier and keep dirty page accumulation low. Adjust `eviction_target`, `eviction_trigger`, and `eviction_dirty_target`/`eviction_dirty_trigger` settings. Increase the maximum number of concurrent WiredTiger transactions if hardware allows, and ensure application indexes minimize scan-and-write overhead.",
    "good_code": "# mongod.conf optimized for write-heavy workloads\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction_target=75,eviction_trigger=90,eviction_dirty_target=3,eviction_dirty_trigger=8,eviction=(threads_max=12)\"\n\n# Dynamic runtime adjustment via MongoDB Shell:\n# db.adminCommand({ setParameter: 1, wiredTigerEngineRuntimeConfig: \"eviction_dirty_target=3,eviction_dirty_trigger=8\" });\n# db.adminCommand({ setParameter: 1, wiredTigerConcurrentReadTransactions: 256 });\n# db.adminCommand({ setParameter: 1, wiredTigerConcurrentWriteTransactions: 256 });",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` and monitor `tracked dirty bytes in the cache` alongside `concurrentTransactions`. Confirm that dirty page percentage remains well below 8% and available read/write tickets do not drop to zero under peak traffic.",
    "date": "2026-08-06",
    "id": 1786014763,
    "type": "error"
});