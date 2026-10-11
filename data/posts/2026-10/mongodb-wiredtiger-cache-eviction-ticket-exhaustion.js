window.onPostDataLoaded({
    "title": "WiredTiger Cache Eviction Stalls & Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-exhaustion",
    "language": "MongoDB",
    "code": "WT_CACHE_FULL",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger manages concurrency using an internal ticket system (defaulting to 128 concurrent read tickets and 128 concurrent write tickets) alongside an internal memory cache configured by default to 50% of (RAM - 1GB). In write-heavy or unindexed analytical workloads, dirty pages accumulate faster than background eviction servers can reconcile them to disk.</p><p>When dirty cache usage exceeds <code>eviction_dirty_trigger</code> (default 20%), WiredTiger forces regular application threads to execute synchronous cache eviction. Application worker threads stall waiting for disk I/O, holding active read/write tickets. As tickets are withheld by stalling workers, incoming queries saturate the ticket queue, causing cascading connection spikes, driver socket timeouts, and complete cluster unresponsive states.</p>",
    "root_cause": "Unindexed queries and high write ingestion cause dirty cache pages to overwhelm background threads, triggering in-thread application eviction that starves the 128 available WiredTiger read/write concurrency tickets.",
    "bad_code": "// Client-side high-throughput unindexed updates saturating tickets\nconst { MongoClient } = require('mongodb');\n\nasync function saturateCluster() {\n  const client = await MongoClient.connect('mongodb://primary:27017');\n  const coll = client.db('telemetry').collection('events');\n\n  // Triggers massive table scans into cache and heavy dirty page generation\n  const promises = [];\n  for (let i = 0; i < 5000; i++) {\n    promises.push(\n      coll.updateOne(\n        { unindexedField: i },\n        { $set: { lastSeen: new Date(), data: Buffer.alloc(1024 * 64) } },\n        { upsert: true }\n      )\n    );\n  }\n  await Promise.all(promises);\n}",
    "solution_desc": "Proactively prevent application thread eviction by tuning WiredTiger background eviction parameters, scaling ticket bounds dynamically where necessary, and adding compound indexes to prevent unindexed scan pages from polluting the cache. Adjust dirty cache triggers via `setParameter` so background eviction initiates earlier.",
    "good_code": "// 1. Ensure queries and upserts have precise indexes to minimize cache pressure\ndb.events.createIndex({ unindexedField: 1 }, { background: true });\n\n// 2. Tune WiredTiger eviction thresholds via administrative command\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_target=75,eviction_trigger=90\"\n});\n\n// 3. Throttle bulk workloads in batches with backoff\nasync function controlledIngest(coll, records, batchSize = 100) {\n  for (let i = 0; i < records.length; i += batchSize) {\n    const batch = records.slice(i, i + batchSize);\n    await coll.bulkWrite(\n      batch.map(doc => ({\n        updateOne: {\n          filter: { indexedField: doc.id },\n          update: { $set: doc },\n          upsert: true\n        }\n      })),\n      { ordered: false }\n    );\n  }\n}",
    "verification": "Execute `db.serverStatus().wiredTiger.concurrentTransactions` during peak load. Confirm that `read.available` and `write.available` remain well above zero and that `wiredTiger.cache[\"pages evicted by application threads\"]` remains 0.",
    "date": "2026-10-11",
    "id": 1791687483,
    "type": "error"
});