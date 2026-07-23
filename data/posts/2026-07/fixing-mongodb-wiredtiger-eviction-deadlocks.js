window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Eviction Deadlocks",
    "slug": "fixing-mongodb-wiredtiger-eviction-deadlocks",
    "language": "MongoDB / C++",
    "code": "WT_ROLLBACK / Cache Full Stall",
    "tags": [
        "MongoDB",
        "SQL",
        "Docker",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>Under high write throughput, MongoDB's WiredTiger engine can saturate its in-memory cache with dirty pages faster than background threads write them to disk. When dirty cache utilization reaches critical thresholds (e.g., >20%), worker threads are forced into foreground cache eviction. This leads to massive thread contention, operation lockups, and cascading timeout deadlocks under continuous write pressure.</p>",
    "root_cause": "High-volume write operations outpace disk IO bandwidth while WiredTiger default eviction parameters allow dirty pages to fill cache before initiating aggressive background eviction.",
    "bad_code": "// Unbounded parallel bulk inserts triggering severe cache starvation\nconst bulkOps = Array.from({ length: 100000 }).map((_, i) => ({\n  insertOne: { document: { id: i, payload: \"x\".repeat(1024 * 32), timestamp: new Date() } }\n}));\n\n// Direct write without application-level backpressure or eviction tuning\nawait db.collection('heavy_ingest').bulkWrite(bulkOps, { ordered: false });",
    "solution_desc": "Tune WiredTiger cache eviction thresholds dynamically via runtime parameters to start eviction earlier, and implement backpressure at the application level.",
    "good_code": "// Tune WiredTiger background eviction thresholds dynamically\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction_target=70,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15\"\n});\n\n// Application-level batched writes with yield delay backpressure\nasync function safeBulkInsert(docs, batchSize = 1000) {\n  for (let i = 0; i < docs.length; i += batchSize) {\n    const batch = docs.slice(i, i + batchSize);\n    await db.collection('heavy_ingest').bulkWrite(\n      batch.map(d => ({ insertOne: { document: d } })),\n      { ordered: false }\n    );\n    await new Promise(res => setTimeout(res, 10)); // Yield thread to mitigate cache spike\n  }\n}",
    "verification": "Monitor `db.serverStatus().wiredtiger.cache[\"tracked dirty bytes in the cache\"]` to ensure dirty page metrics stay consistently under 10% during heavy workload runs.",
    "date": "2026-07-23",
    "id": 1784771631,
    "type": "error"
});