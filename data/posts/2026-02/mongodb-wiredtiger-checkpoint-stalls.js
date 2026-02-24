window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Write Stalls",
    "slug": "mongodb-wiredtiger-checkpoint-stalls",
    "language": "SQL",
    "code": "WiredTigerError",
    "tags": [
        "MongoDB",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger, MongoDB's default storage engine, performs 'checkpoints' every 60 seconds (or 2GB of data) to persist data from memory to disk. During high-write scenarios, the volume of 'dirty data' can become so large that the checkpoint process saturates disk I/O. When this happens, application threads trying to perform new writes are throttled or stalled (the 'WiredTiger Write Stall'), leading to dramatic spikes in execution time and connection queuing.</p>",
    "root_cause": "The default checkpoint interval and eviction triggers allow too much dirty data to accumulate, causing a massive I/O burst that exceeds disk throughput capabilities.",
    "bad_code": "// Default configuration often leads to 60s spikes\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Large cache, but default eviction",
    "solution_desc": "Adjust the WiredTiger eviction parameters to be more aggressive, flushing data more frequently in smaller chunks rather than one large burst. Also, ensure the disk has sufficient IOPS or use a faster storage tier (NVMe). Tuning the `eviction_trigger` helps start the cleanup earlier.",
    "good_code": "// Adjusting mongod.conf for smoother I/O\nsetParameter:\n  wiredTigerConcurrentReadTransactions: 128\n  wiredTigerConcurrentWriteTransactions: 128\nstorage:\n  wiredTiger:\n    engineConfig:\n      configString: \"eviction_trigger=80,eviction_target=70,checkpoint_clock=30\"",
    "verification": "Monitor the `wiredTiger.cache.tracked dirty bytes in the cache` metric in Mongostat and verify it doesn't cross the eviction threshold abruptly.",
    "date": "2026-02-24",
    "id": 1771895742,
    "type": "error"
});