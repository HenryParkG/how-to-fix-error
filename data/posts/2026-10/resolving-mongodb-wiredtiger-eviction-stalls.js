window.onPostDataLoaded({
    "title": "Resolving WiredTiger Dirty Cache Stalls in MongoDB",
    "slug": "resolving-mongodb-wiredtiger-eviction-stalls",
    "language": "Go",
    "code": "WT_CACHE_FULL",
    "tags": [
        "Go",
        "Backend",
        "Kubernetes",
        "SQL",
        "MongoDB",
        "Error Fix"
    ],
    "analysis": "<p>In write-intensive MongoDB deployments, database instances can suddenly experience catastrophic throughput collapse accompanied by surging latency spikes. Diagnostics typically show application thread starvation with MongoDB metrics exposing <code>wiredTiger.concurrentTransactions.read.out</code> reaching max capacity (typically 128 tickets), alongside zero available write tickets.</p><p>Under normal conditions, WiredTiger uses dedicated background eviction server threads to flush modified (dirty) pages from the in-memory cache to disk. By default, background eviction kicks in when the dirty cache reaches 5% of <code>cacheSizeGB</code>. However, if disk I/O saturates or checkpoint write locks block dirty page reconciliation, dirty data can breach 20% of the cache. When this occurs, WiredTiger switches to aggressive client eviction: incoming application threads executing reads and writes are hijacked to flush dirty pages synchronously to disk. Because client threads contend on internal page locks and wait on overloaded block managers, read tickets are rapidly depleted, creating a cluster-wide cascading stall.</p>",
    "root_cause": "Dirty page generation exceeds disk write IOPS capacity, causing dirty cache usage to breach WiredTiger's client-assisted eviction threshold (20%), turning client request threads into synchronous storage flushers.",
    "bad_code": "// Default WiredTiger cache configuration under heavy burst writes\nstorage:\n  dbPath: /data/db\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 32\n      # Defaults leave eviction threads under-provisioned\n      # eviction_target: 80% (clean), eviction_dirty_target: 5%\n      # eviction_dirty_trigger: 20% (forces client eviction)\n      configString: \"eviction=(threads_min=4,threads_max=4)\"",
    "solution_desc": "Tune WiredTiger cache eviction parameters via `configString` to trigger proactive background eviction earlier, increase eviction thread pools, adjust checkpoint timeouts to prevent lock hold spikes, and allocate separate dedicated I/O channels for write-ahead logs (journal).",
    "good_code": "storage:\n  dbPath: /data/db\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 28\n      # Lower dirty triggers and scale eviction threads to avoid client eviction hijacking\n      configString: >-\n        eviction=(threads_min=8,threads_max=16),\n        eviction_dirty_target=3,\n        eviction_dirty_trigger=12,\n        eviction_target=75,\n        eviction_trigger=90,\n        checkpoint=(wait=30,log_size=2GB)",
    "verification": "Monitor MongoDB diagnostic metrics using `db.serverStatus().wiredTiger.cache`. Confirm that `tracked dirty pages in the cache` stays well below the 12% trigger and verify that `pages walked for eviction by application threads` remains consistently near 0.",
    "date": "2026-10-16",
    "id": 1792136503,
    "type": "error"
});