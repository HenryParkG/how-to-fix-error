window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Choke",
    "slug": "fixing-wiredtiger-cache-eviction-choke",
    "language": "MongoDB",
    "code": "Write Ticket Starvation",
    "tags": [
        "AWS",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, relies on an internal cache to manage document reads and writes. When the database experiences heavy, sustained write workloads, the rate at which dirty data is generated can outpace the cache's background eviction threads. This triggers a critical state where WiredTiger's cache usage climbs past the default threshold (95% dirty pages). At this point, client application threads are forced to run synchronous page eviction inside their own context. Because these client threads are occupied performing heavy memory flushing instead of processing requests, the pool of available write tickets (by default, 128 concurrent transactions) is completely exhausted, leading to write ticket starvation, skyrocketing latency, and application timeouts.</p>",
    "root_cause": "WiredTiger background eviction threads fail to keep up with incoming write operations, causing dirty pages to cross the critical 95% threshold. This transitions eviction from background threads to client threads, stalling execution and starving the concurrent transactions pool.",
    "bad_code": "# Default deployment configuration leading to cache choke\n# in high-throughput write-heavy Docker environments\nmongod --dbpath /data/db \\\n  --wiredTigerCacheSizeGB 4 \\\n  # Leaving eviction target parameters to unoptimized defaults",
    "solution_desc": "To resolve this choke, optimize the WiredTiger eviction parameters. We will adjust the dirty target and trigger values to start background eviction much earlier, allocate more background eviction threads, and scale the WiredTiger cache size dynamically and precisely to avoid resource contention.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_dirty_trigger=80,eviction_dirty_target=60,eviction_workers_min=4,eviction_workers_max=12\"\n});\n\n// Update mongod.conf configuration for persistence:\n// storage:\n//   wiredTiger:\n//     engineConfig:\n//       configString: \"eviction_dirty_trigger=80,eviction_dirty_target=60,eviction_workers_min=4,eviction_workers_max=12\"",
    "verification": "Run `db.serverStatus().wiredTiger.concurrentTransactions` to verify that read/write ticket occupancy remains well below 128. Monitor `db.serverStatus().wiredTiger.cache[\"tracked dirty bytes in the cache\"]` to ensure the dirty cache ratio is maintained below the trigger threshold.",
    "date": "2026-07-17",
    "id": 1784284217,
    "type": "error"
});