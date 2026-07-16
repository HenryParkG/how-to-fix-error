window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction and Ticket Starvation",
    "slug": "fixing-mongodb-wiredtiger-cache-starvation",
    "language": "SQL",
    "code": "WT_CACHE_FULL",
    "tags": [
        "SQL",
        "Docker",
        "MongoDB",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under heavy write-intensive workloads, MongoDB clusters frequently experience catastrophic latency spikes caused by WiredTiger cache eviction choke points and subsequent ticket starvation. WiredTiger uses read/write tickets (defaulting to 128) to regulate concurrent operations inside the storage engine. When the rate of dirty data creation exceeds the storage engine's background eviction rate (default target of 20% dirty pages), application threads are forced to perform write stalls and participate in synchronous cache eviction. This blocks the active ticket pool, resulting in ticket starvation and cascading application-level timeouts.</p>",
    "root_cause": "The database ingestion rate exceeds the physical I/O bandwidth or configured dirty page eviction thresholds, forcing application writer threads to shift to synchronous cache eviction, consuming the 128 available WiredTiger write tickets.",
    "bad_code": "// Default MongoDB configuration run under high-concurrency ingestion rates\n// This allows dirty data to pile up unchecked without aggressive eviction\ndb.adminCommand({\n    setParameter: 1,\n    // Inefficient defaults for massive write loads on modern NVMe drives\n    wiredTigerEngineRuntimeConfig: \"eviction_target=80,eviction_trigger=95\"\n});",
    "solution_desc": "Adjust MongoDB's internal WiredTiger parameters to trigger cache eviction earlier and configure more background threads. Lowering eviction_dirty_target and eviction_dirty_trigger ensures the engine flushes dirty pages before application threads are hijacked. Increasing concurrent eviction threads matches the high-throughput write pipeline.",
    "good_code": "// Configure aggressive background eviction to prevent ticket exhaustion\ndb.adminCommand({\n    setParameter: 1,\n    wiredTigerEngineRuntimeConfig: \"eviction_target=75,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=10,eviction_workers_min=4,eviction_workers_max=16\"\n});\n\n// Verify the runtime parameters take immediate effect\nprintjson(db.serverStatus().wiredTiger.concurrentTransactions);",
    "verification": "Run a write stress test. Run 'db.serverStatus().wiredTiger.concurrentTransactions' and monitor 'write.out' and 'write.available'. Verify available tickets remain close to 128 and the dirty cache percentage stays below 10% without spikes.",
    "date": "2026-07-16",
    "id": 1784166388,
    "type": "error"
});