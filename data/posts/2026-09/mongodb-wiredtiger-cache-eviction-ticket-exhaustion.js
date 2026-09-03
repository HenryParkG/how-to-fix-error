window.onPostDataLoaded({
    "title": "MongoDB: WiredTiger Eviction Stalls & Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-exhaustion",
    "language": "MongoDB",
    "code": "TicketExhaustion",
    "tags": [
        "MongoDB",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB utilizes the WiredTiger storage engine, which allocates a concurrency ticket system (default 128 read and 128 write tickets) to regulate access to storage engine operations. When write pressure or large document scans saturate the WiredTiger cache, dirty cache percentage rises above configured eviction thresholds.</p><p>Once dirty data crosses the eviction target (typically 20%), normal worker threads are co-opted to perform inline page reconciliation and eviction instead of processing incoming database requests. This results in read/write ticket exhaustion, massive latency spikes, and socket connection accumulation.</p>",
    "root_cause": "WiredTiger dirty cache ratio surpasses eviction triggers due to slow I/O or unbounded working sets, causing application threads to stall while performing synchronous eviction, depleting available concurrency tickets.",
    "bad_code": "// Mongo Shell diagnostic check during incident\ndb.serverStatus().wiredTiger.concurrentTransactions;\n// Sample problematic output:\n// {\n//   \"write\": { \"out\": 128, \"available\": 0, \"totalTickets\": 128 },\n//   \"read\":  { \"out\": 128, \"available\": 0, \"totalTickets\": 128 }\n// }\n\n// Unbounded update script causing severe cache dirtying without index support\ndb.events.updateMany(\n  { processed: false },\n  { $set: { processed: true, payload: BinData(0, \"...\") } }\n);",
    "solution_desc": "Tune WiredTiger cache eviction parameters to trigger background eviction earlier, size cache pools correctly relative to system RAM, and pace bulk write operations to prevent dirty pages from overwhelming the eviction server.",
    "good_code": "// Apply optimized eviction thresholds to start background eviction aggressively\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction_target=75,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15\"\n});\n\n// Batch high-volume writes and leverage indexes to prevent broad scanning\nconst batchSize = 1000;\nlet cursor = db.events.find({ processed: false }, { _id: 1 }).limit(batchSize);\n\nwhile (cursor.hasNext()) {\n  const ids = cursor.toArray().map(doc => doc._id);\n  db.events.updateMany(\n    { _id: { $in: ids } },\n    { $set: { processed: true } }\n  );\n  cursor = db.events.find({ processed: false }, { _id: 1 }).limit(batchSize);\n}",
    "verification": "Monitor `db.serverStatus().wiredTiger.concurrentTransactions.read.available` and `write.available` via MongoDB Prometheus exporter to verify ticket availability remains above 80% during peak write workloads.",
    "date": "2026-09-03",
    "id": 1788401414,
    "type": "error"
});