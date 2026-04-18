window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Ticket Exhaustion in MongoDB",
    "slug": "mongodb-wiredtiger-ticket-exhaustion",
    "language": "Node.js",
    "code": "TicketExhaustion",
    "tags": [
        "AWS",
        "Infra",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a ticketing system to control concurrency, defaulting to 128 concurrent read and 128 concurrent write tickets. In high-concurrency workloads, especially those involving slow disk I/O or unindexed queries, these tickets are held for longer durations. Once all tickets are exhausted, new operations queue up, leading to a massive spike in latency and eventually making the database unresponsive even if CPU usage is low.</p>",
    "root_cause": "Long-running write operations or lack of indexes cause operations to hold WiredTiger write tickets longer than the arrival rate of new requests.",
    "bad_code": "// High concurrency write without indexes\nfor (let i = 0; i < 1000; i++) {\n  db.collection('logs').insertOne({ timestamp: Date.now(), msg: 'test' });\n}\n// If 'logs' is heavily fragmented or lacks IOPS, tickets exhaust.",
    "solution_desc": "Optimize query performance via indexing to reduce ticket hold time, and implement application-level concurrency limiting or connection pooling to prevent overwhelming the engine.",
    "good_code": "// 1. Ensure Index exists to speed up writes/updates\ndb.collection('logs').createIndex({ timestamp: 1 });\n\n// 2. Monitor tickets via serverStatus\nconst status = db.serverStatus().wiredTiger.concurrentTransactions;\nconsole.log(`Write tickets available: ${status.write.available}`);",
    "verification": "Check MongoDB 'db.serverStatus().wiredTiger.concurrentTransactions' during peak load to ensure 'available' tickets remain above zero.",
    "date": "2026-04-18",
    "id": 1776495444,
    "type": "error"
});