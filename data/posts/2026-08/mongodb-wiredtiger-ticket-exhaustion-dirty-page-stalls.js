window.onPostDataLoaded({
    "title": "MongoDB WiredTiger Ticket Exhaustion & Dirty Page Stalls",
    "slug": "mongodb-wiredtiger-ticket-exhaustion-dirty-page-stalls",
    "language": "MongoDB",
    "code": "WiredTigerStalls",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "Database",
        "Performance",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine uses an internal system of 'tickets' to manage concurrent read and write operations. These tickets control the number of active operations that can concurrently access the storage engine. Each read or write operation requires a ticket. When all tickets are exhausted, new operations must wait, leading to application-level stalls and increased latency.</p><p>A common scenario for ticket exhaustion is high throughput with an uneven workload distribution, or, more critically, when dirty page eviction is slow. WiredTiger maintains a cache of data pages. Writes modify these pages, marking them 'dirty'. Dirty pages must eventually be flushed to disk. If the rate of dirty page creation exceeds the rate at which they can be flushed (due to slow I/O, misconfigured storage, or an overwhelmed write-back mechanism), the cache fills up with dirty pages. WiredTiger then aggressively tries to evict these pages, which can consume a significant number of write tickets, leaving fewer tickets for incoming write operations, exacerbating the exhaustion problem and leading to cascading stalls.</p>",
    "root_cause": "Sustained high write load, slow underlying storage I/O, insufficient WiredTiger cache size, or an imbalanced read/write ticket configuration leading to dirty page accumulation and slow eviction.",
    "bad_code": "mongo.connect('mongodb://localhost/mydb', { useNewUrlParser: true, useUnifiedTopology: true });\n\n// Application code generating very high write volume with slow disks\n// or complex update operations causing page fragmentation/high dirty page ratio.",
    "solution_desc": "Architecturally, address the root cause by optimizing storage I/O, scaling MongoDB instances, adjusting WiredTiger cache settings, and optimizing write patterns. Monitor key metrics like 'wiredTiger.concurrentTransactions.write.out' and 'wiredTiger.cache.tracked dirty bytes in the cache'. Increase I/O capacity, improve disk performance (e.g., faster SSDs, RAID configurations, or cloud provisioned IOPS). Adjust the WiredTiger cache size if memory is available and the default (50% of RAM) is insufficient for the working set. Optimize application write operations to be less resource-intensive, for example, by batching writes or reducing the complexity of update operators. Consider sharding for horizontal scaling under extreme load. For urgent relief, increasing `wiredTiger.engineConfig.writeTickets` (and `readTickets`) can provide temporary breathing room, but it doesn't fix the underlying I/O bottleneck.",
    "good_code": "db.adminCommand({setParameter: 1, 'wiredTigerEngineRuntimeConfig': 'write_tickets=256, read_tickets=256'});\n\n// Example of optimizing writes (consider bulk operations)\ndb.collection.bulkWrite([\n  { insertOne: { document: { ... } } },\n  { updateOne: { filter: { _id: ObjectId(...) }, update: { $set: { ... } } } }\n]);\n\n// Ensure appropriate hardware and OS-level I/O tuning.",
    "verification": "Monitor MongoDB's `ftdc.oplog.latency` and `wiredTiger.concurrentTransactions.write.available` and `read.available` metrics. A healthy system will show available tickets above zero consistently and low operation latency. Disk I/O metrics (IOPS, throughput, latency) should also show improvement and capacity to handle the workload without saturation. Observe `wiredTiger.cache.tracked dirty bytes in the cache` to ensure it's not consistently high, indicating inefficient dirty page eviction.",
    "date": "2026-08-20",
    "id": 1787186438,
    "type": "error"
});