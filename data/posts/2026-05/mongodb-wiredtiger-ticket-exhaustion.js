window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Ticket Exhaustion in MongoDB",
    "slug": "mongodb-wiredtiger-ticket-exhaustion",
    "language": "Golang / MongoDB",
    "code": "Resource Exhaustion",
    "tags": [
        "MongoDB",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency MongoDB environments, the WiredTiger storage engine uses 'tickets' to control the number of concurrent read and write operations (default is 128). When all tickets are checked out, new requests queue, leading to a massive spike in 'queue.read' or 'queue.write' metrics. This often triggers a death spiral: long-running queries hold tickets longer, causing more requests to queue, which consumes more system memory and CPU for context switching.</p>",
    "root_cause": "Slow, unindexed queries or massive bulk writes holding WiredTiger concurrency slots too long under high parallel load.",
    "bad_code": "// High concurrency without index optimization\nfor i := 0; i < 1000; i++ {\n    go func() {\n        // Querying on unindexed field 'status'\n        coll.Find(ctx, bson.M{\"status\": \"pending\"}).All(&results)\n    }()\n}",
    "solution_desc": "1. Ensure 100% index coverage for hot queries. 2. Implement client-side rate limiting or connection pooling. 3. (Advanced) Increase 'wiredTiger.concurrentTransactions' only if CPU/IOPS headroom exists.",
    "good_code": "// 1. Add index: db.orders.createIndex({status: 1})\n// 2. Limit concurrency in Go\nsem := make(chan struct{}, 50) // Max 50 concurrent DB ops\nfor i := 0; i < 1000; i++ {\n    go func() {\n        sem <- struct{}{}\n        defer func() { <-sem }()\n        coll.Find(ctx, bson.M{\"status\": \"pending\"}).All(&results)\n    }()\n}",
    "verification": "Monitor `db.serverStatus().wiredTiger.concurrentTransactions`. Ensure 'out' remains below the total available tickets and 'queued' stays near zero.",
    "date": "2026-05-11",
    "id": 1778500674,
    "type": "error"
});