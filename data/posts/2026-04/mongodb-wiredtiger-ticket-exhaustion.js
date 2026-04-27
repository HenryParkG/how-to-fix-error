window.onPostDataLoaded({
    "title": "MongoDB: Resolving WiredTiger Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-ticket-exhaustion",
    "language": "SQL",
    "code": "TicketExhaustion",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a ticketing system to control concurrency for read and write operations, defaulting to 128 tickets each. When high-concurrency write pressure occurs, especially on slow I/O subsystems like AWS EBS, the tickets are held longer while waiting for disk flushes. Once all 128 tickets are in use, all subsequent operations are queued, leading to a massive spike in latency and eventually application timeouts.</p><p>This state is often misdiagnosed as CPU saturation, but it is actually a resource contention issue within the storage engine's concurrency controller.</p>",
    "root_cause": "Disk I/O latency (iowait) preventing the storage engine from completing write transactions and releasing tickets back to the pool, combined with an uncapped application connection pool.",
    "bad_code": "// Mongo Shell check\n// If 'out' is consistently 128, you are exhausted\ndb.serverStatus().wiredTiger.concurrentTransactions;\n/* \nOutput shows:\n\"write\" : { \"out\" : 128, \"available\" : 0, \"totalTickets\" : 128 }\n*/",
    "solution_desc": "First, improve underlying disk IOPS (e.g., move to Provisioned IOPS). Second, implement application-level backpressure or connection pooling limits. Finally, as a temporary measure, you can dynamically increase the ticket count, though this may increase CPU context switching.",
    "good_code": "// Increase tickets dynamically (use with caution)\ndb.adminCommand({ \n    setParameter: 1, \n    wiredTigerConcurrentWriteTransactions: 256 \n});\n\n// Better: Configure flow control to throttle writes \n// when lag exceeds threshold\ndb.adminCommand({ \n    setParameter: 1, \n    enableFlowControl: true,\n    flowControlTargetLagSeconds: 10\n});",
    "verification": "Use `mongostat` to observe the 'qr' (queue read) and 'qw' (queue write) columns. After the fix, these should return to near-zero values.",
    "date": "2026-04-27",
    "id": 1777254939,
    "type": "error"
});