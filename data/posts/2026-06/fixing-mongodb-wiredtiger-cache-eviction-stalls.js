window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "fixing-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "WriteTicketStarvation",
    "tags": [
        "Docker",
        "MongoDB",
        "NoSQL",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine manages memory using an internal cache. Under write-heavy workloads, data modifications ('dirty data') build up in this cache. WiredTiger triggers background threads to evict these dirty pages to disk once thresholds are crossed.</p><p>If the ingestion rate exceeds the disk I/O throughput, dirty data reaches the 20% default critical threshold. At this point, WiredTiger switches to 'user-thread eviction', forcing application client connection threads to perform memory reclamation instead of processing queries. This causes write ticket exhaustion (default 128 available tickets drop to zero) and cascades into catastrophic, multi-second latency spikes across the application layer.</p>",
    "root_cause": "Highly intensive write workloads exceeding the background eviction thread capacity, causing dirty cache to build up beyond the 20% critical threshold, triggering user-thread eviction and write ticket depletion.",
    "bad_code": "// Default WiredTiger configuration lacks aggressive background eviction, leaving defaults active\n// Client code executing writes with unsafe write concerns and unthrottled thread pools\nconst batch = db.collection('telemetry').initializeUnorderedBulkOp();\nfor (let i = 0; i < 1000000; i++) {\n  batch.insert({ ts: new Date(), device: i, payload: \"data\".repeat(50) });\n}\nawait batch.execute({ w: \"majority\" });",
    "solution_desc": "Tune the WiredTiger engine configuration parameters using db.adminCommand to increase the background eviction thread pool and lower the dirty trigger thresholds. This forces aggressive background eviction before user-thread eviction can be triggered, and reserves client write tickets.",
    "good_code": "// Lower thresholds to start background eviction early and increase eviction threads\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=8,threads_max=16),eviction_dirty_target=5,eviction_dirty_trigger=10\"\n});\n\n// Client-side fix: Apply application-level rate limiting / batch throttling\n// to match target storage engine persistence capacities.",
    "verification": "Run `db.serverStatus().wiredTiger.cache` periodically. Confirm that 'tracked dirty bytes in the cache' stays consistently below 10%, and monitor `db.serverStatus().concurrentTransactions` to ensure write tickets available remains above 10% of total ticket limits during peak loads.",
    "date": "2026-06-06",
    "id": 1780726918,
    "type": "error"
});