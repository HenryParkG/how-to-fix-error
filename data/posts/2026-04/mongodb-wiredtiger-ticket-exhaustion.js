window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-ticket-exhaustion",
    "language": "MongoDB",
    "code": "WiredTigerTickets",
    "tags": [
        "SQL",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a ticketing system to limit the number of concurrent operations processed by the storage engine (defaulting to 128 for read/write). Under high write contention or long-running transactions, these tickets are held longer, causing new requests to queue and latency to spike. This often manifests as 'available tickets' dropping to zero in mongostat.</p>",
    "root_cause": "High lock contention or unoptimized, long-running write operations saturating the available 128 concurrent execution slots.",
    "bad_code": "// Simulated heavy contention on a single document\nfor (let i = 0; i < 1000; i++) {\n    db.collection.updateMany({ status: 'active' }, { $set: { val: i } });\n    // Large updates lock the collection/documents longer, depleting tickets\n}",
    "solution_desc": "Optimize queries to reduce execution time, implement client-side rate limiting, and split monolithic updates into smaller batches to yield tickets faster.",
    "good_code": "// Optimized batch processing with sleep to allow ticket recycling\nconst batches = db.collection.find({ status: 'active' }).batchSize(100);\nwhile (batches.hasNext()) {\n    const ids = batches.next().map(d => d._id);\n    db.collection.updateMany({ _id: { $in: ids } }, { $set: { val: currentVal } });\n    // Yield control to allow other threads to acquire tickets\n}",
    "verification": "Monitor 'wiredTiger.concurrentTransactions' via db.serverStatus() to ensure available tickets remain above 20% during peak load.",
    "date": "2026-04-01",
    "id": 1775027404,
    "type": "error"
});