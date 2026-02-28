window.onPostDataLoaded({
    "title": "Resolving MongoDB WiredTiger Read Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-ticket-exhaustion",
    "language": "NoSQL",
    "code": "ExhaustionError",
    "tags": [
        "SQL",
        "Infra",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a ticketing system to limit the number of concurrent operations processed by the storage engine (default 128). Under heavy write contention or slow I/O, write locks block the flow, and read operations queue up until they exhaust all available read tickets, resulting in a total application hang for database queries.</p>",
    "root_cause": "Long-running write operations or lack of indexing causing high I/O wait times, which saturate the concurrent execution slots (tickets) in the WiredTiger engine.",
    "bad_code": "// Example of a high-contention write without proper indexing\ndb.collection.updateMany(\n    { \"status\": \"pending\" }, // If 'status' is not indexed, this performs a collection scan\n    { \"$set\": { \"processed\": true } }\n)",
    "solution_desc": "Optimize query performance with proper indexing to reduce execution time per ticket. If the hardware can handle more concurrency, increase the ticket limit, though scaling IOPS is the preferred architectural fix.",
    "good_code": "// 1. Add index to prevent collection scans\ndb.collection.createIndex({ \"status\": 1 });\n\n// 2. Adjust tickets (via mongo shell) if hardware permits\ndb.adminCommand({ \n    setParameter: 1, \n    wiredTigerConcurrentReadTransactions: 256 \n});",
    "verification": "Check 'db.serverStatus().wiredTiger.concurrentTransactions' to monitor available vs. out tickets during peak load.",
    "date": "2026-02-28",
    "id": 1772251960,
    "type": "error"
});