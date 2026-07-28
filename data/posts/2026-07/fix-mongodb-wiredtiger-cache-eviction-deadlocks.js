window.onPostDataLoaded({
    "title": "Fix MongoDB WiredTiger Cache Eviction Deadlocks",
    "slug": "fix-mongodb-wiredtiger-cache-eviction-deadlocks",
    "language": "MongoDB / C++",
    "code": "WiredTigerCacheFull",
    "tags": [
        "SQL",
        "Backend",
        "MongoDB",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained write-heavy workloads, MongoDB instances using the WiredTiger storage engine can experience severe write stalls and deadlock-like behavior. When the cache percentage of dirty bytes exceeds target thresholds, application operations are hijacked to assist in synchronous page eviction.</p><p>If concurrent incoming writes overwhelm eviction worker threads, internal B-Tree handle locking conflicts arise between checkpoint threads and application threads, leading to zero-throughput stalls and database connection timeouts.</p>",
    "root_cause": "The default WiredTiger cache configuration permits application worker threads to perform synchronous eviction when dirty page capacity reaches `eviction_dirty_trigger`. Under rapid concurrent write spikes, thread lock contention locks cache structures, stopping dirty page flushes.",
    "bad_code": "// Unconfigured WiredTiger settings under heavy concurrent write pipelines\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=4,threads_max=4),cache_size=8GB\"\n});\n// Ingestion script inserts records without rate-limiting backpressure",
    "solution_desc": "Configure dynamic eviction thread pools in WiredTiger, reduce `eviction_dirty_target` and `eviction_dirty_trigger` percentages to force early background flushes, and integrate application-side backpressure based on cache dirtiness state.",
    "good_code": "// Tune WiredTiger dirty page eviction thresholds\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=8,threads_max=20),eviction_dirty_target=5,eviction_dirty_trigger=12,eviction_updates_target=3\"\n});\n\n// Application layer write throttler preventing cache saturations\nasync function safeInsertMany(collection, documents) {\n  const stats = await db.command({ serverStatus: 1 });\n  const dirtyBytes = stats.wiredTiger.cache[\"tracked dirty bytes in the cache\"];\n  const maxBytes = stats.wiredTiger.cache[\"maximum bytes configured\"];\n  \n  if (dirtyBytes / maxBytes > 0.10) {\n    // Introduce backpressure delay if dirty bytes cross 10%\n    await new Promise((resolve) => setTimeout(resolve, 150));\n  }\n  return await collection.insertMany(documents, { ordered: false });\n}",
    "verification": "Execute `db.serverStatus().wiredTiger.cache` under peak batch write conditions. Confirm that `tracked dirty bytes in the cache` remains below 10-12% and `application threads page read/write hours due to cache pressure` drops to zero.",
    "date": "2026-07-28",
    "id": 1785226490,
    "type": "error"
});