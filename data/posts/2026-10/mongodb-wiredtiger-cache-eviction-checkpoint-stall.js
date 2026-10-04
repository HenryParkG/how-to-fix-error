window.onPostDataLoaded({
    "title": "MongoDB WiredTiger Cache Eviction & Checkpoint Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-checkpoint-stall",
    "language": "MongoDB",
    "code": "WT_CACHE_FULL",
    "tags": [
        "MongoDB",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput write environments, MongoDB instances utilizing the WiredTiger storage engine can experience checkpoint stall cascades. WiredTiger uses an in-memory cache to buffer read pages and write modifications. Eviction servers continuously flush dirty pages to maintain the dirty data percentage below `eviction_dirty_target` (default 5%) and overall cache utilization below `eviction_target` (default 80%).</p><p>When write volume exceeds storage I/O bandwidth, dirty cache fills beyond `eviction_dirty_trigger` (default 20%). At this point, WiredTiger engages client application threads to perform synchronous evictions. Concurrently, WiredTiger schedules periodic checkpoints (default every 60 seconds). Because checkpoints must reconcile internal b-trees to create a durable point-in-time snapshot, they acquire schema and transaction locks while saturating disk queues, completely stalling application threads forced into cache eviction.</p>",
    "root_cause": "The generation rate of dirty cache pages outpaces the I/O throughput of the underlying disk subsystem. When dirty cache surpasses the critical threshold, client worker threads are co-opted into eviction duties while concurrently blocked on disk sync operations triggered by checkpoint flushes.",
    "bad_code": "# Default / poorly configured mongod.conf under write-heavy loads\nstorage:\n  dbPath: /data/db\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# No eviction trigger tuning, default 60s checkpoint interval,\n# and unlimited client-thread participation in eviction under contention.",
    "solution_desc": "Architecturally decouple eviction pressure from checkpoint I/O surges. Increase background eviction threads, reduce checkpoint intervals to avoid massive periodic I/O spikes, and tune WiredTiger runtime parameters to initiate background eviction earlier while strictly limiting the conditions under which client threads are forced to perform dirty page evictions.",
    "good_code": "# Tuned mongod.conf\nstorage:\n  dbPath: /data/db\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 28\n      configString: >-\n        eviction=(threads_min=4,threads_max=12),\n        eviction_dirty_target=5,\n        eviction_dirty_trigger=15,\n        eviction_target=75,\n        eviction_trigger=90,\n        checkpoint=(wait=30,log_size=2GB)",
    "verification": "Monitor MongoDB via `db.serverStatus().wiredTiger.cache`. Confirm that `pages evicted by application threads` stays near zero and `tracked dirty bytes in the cache` remains below the eviction trigger threshold during peak ingestion workloads.",
    "date": "2026-10-04",
    "id": 1791084417,
    "type": "error"
});