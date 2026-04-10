window.onPostDataLoaded({
    "title": "Fixing WiredTiger Ticket Exhaustion in MongoDB",
    "slug": "mongodb-wiredtiger-ticket-exhaustion",
    "language": "SQL",
    "code": "TicketExhaustion",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a semaphore-based ticketing system to control concurrent read and write operations (default 128 each). In write-heavy clusters, if disk I/O becomes a bottleneck or lock contention occurs, operations take longer to complete. This holds tickets for extended periods, leading to 'ticket exhaustion' where new incoming requests are queued, causing massive latency and eventual node failure.</p>",
    "root_cause": "Slow I/O or unoptimized queries causing operations to hold WiredTiger read/write tickets longer than the replenishment rate.",
    "bad_code": "// Default configuration often fails under extreme burst loads\n// db.serverStatus().wiredTiger.concurrentTransactions\n{\n  \"write\" : { \"out\" : 128, \"available\" : 0 }\n}",
    "solution_desc": "Identify and optimize slow queries using the Profiler. If hardware is the bottleneck, increase IOPS or move to faster storage. As a temporary buffer, tune 'wiredTigerConcurrentWriteTransactions', though this can increase CPU context switching.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  wiredTigerConcurrentWriteTransactions: 256\n});\n// Always accompany with index optimization:\ndb.collection.createIndex({ high_volume_key: 1 }, { background: true });",
    "verification": "Run 'db.serverStatus().wiredTiger.concurrentTransactions' and ensure 'available' tickets stay consistently above zero during peak load.",
    "date": "2026-04-10",
    "id": 1775784536,
    "type": "error"
});