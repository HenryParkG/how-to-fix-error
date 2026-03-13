window.onPostDataLoaded({
    "title": "Eliminating WiredTiger Ticket Contention in MongoDB",
    "slug": "mongodb-wiredtiger-ticket-contention",
    "language": "SQL",
    "code": "WriteTicketExhaustion",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger, the default storage engine for MongoDB, uses a ticketing system to control concurrency. By default, it allows 128 concurrent read tickets and 128 concurrent write tickets. In write-heavy clusters, if disk I/O latency increases or long-running transactions hold locks, these tickets are exhausted. New operations are queued, leading to a massive spike in application-side latency and potentially causing a cascading failure where connection pools are exhausted.</p>",
    "root_cause": "Saturation of concurrent execution slots due to slow storage I/O or unoptimized queries holding tickets longer than necessary.",
    "bad_code": "// Application logic performing unindexed updates in a loop\nfor (Document doc : updates) {\n    collection.updateOne(eq(\"non_indexed_field\", doc.get(\"val\")), set(\"status\", \"processed\"));\n}",
    "solution_desc": "1. Ensure all write operations are supported by indexes to minimize ticket hold time. 2. Increase IOPS on the underlying storage (e.g., move to AWS io2 volumes). 3. Use bulk writes to reduce the number of individual ticket requests. 4. If the CPU and Disk have headroom, consider increasing `wiredTiger.concurrentTransactions` (only as a last resort).",
    "good_code": "// Optimized: Bulk write with proper indexing\n// 1. Create Index: db.collection.createIndex({indexed_field: 1})\n\nList<UpdateOneModel<Document>> requests = new ArrayList<>();\nfor (Document doc : updates) {\n    requests.add(new UpdateOneModel<>(\n        eq(\"indexed_field\", doc.get(\"val\")), \n        set(\"status\", \"processed\")\n    ));\n}\ncollection.bulkWrite(requests, new BulkWriteOptions().ordered(false));",
    "verification": "Run `db.serverStatus().wiredTiger.concurrentTransactions`. If 'available' tickets remain consistently near 128 under load and the 'out' count is low, the contention is resolved.",
    "date": "2026-03-13",
    "id": 1773384035,
    "type": "error"
});