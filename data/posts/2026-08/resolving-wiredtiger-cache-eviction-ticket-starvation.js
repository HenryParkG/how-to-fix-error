window.onPostDataLoaded({
    "title": "Resolving WiredTiger Cache Eviction & Ticket Starvation",
    "slug": "resolving-wiredtiger-cache-eviction-ticket-starvation",
    "language": "MongoDB / C++",
    "code": "WIREDTIGER_TICKET_EXHAUSTION",
    "tags": [
        "MongoDB",
        "Database",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When MongoDB receives sustained high-write throughput or unindexed update operations, the WiredTiger storage engine's dirty page generation rate can exceed background eviction capacity. When dirty cache utilization breaches configured thresholds (e.g., 20% dirty target), application threads are drafted to assist with synchronous page evictions. As application threads stall waiting for disk I/O during inline eviction, they hold WiredTiger read/write tickets open. This quickly exhausts the concurrent ticket pool (default 128 tickets), leading to cascading connection queuing, skyrocketing operation latencies, and cluster-wide stalls.</p>",
    "root_cause": "Dirty write generation rate outpaces background eviction threads, triggering synchronous application thread eviction and exhausting available WiredTiger read/write transaction tickets.",
    "bad_code": "storage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 8\n      # Unconfigured eviction thresholds defaults allow dirty cache build-up\n      # under bursty write loads, forcing worker thread stalls.\n\n# System allows unbounded incoming connections that saturate read/write tickets\nnet:\n  maxIncomingConnections: 65536",
    "solution_desc": "Tune WiredTiger engine eviction configurations to force aggressive background eviction before application threads are drafted. Combine this with connection pool bounds and ticket configuration adjustments in `mongod.conf`.",
    "good_code": "storage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=5,eviction_dirty_trigger=10\"\n\nnet:\n  maxIncomingConnections: 4096",
    "verification": "Monitor database status via `db.serverStatus().wiredTiger.concurrentTransactions` and `db.serverStatus().wiredTiger.cache`. Confirm that available read/write tickets remain above zero and dirty cache percentage stays below 10% during peak write traffic.",
    "date": "2026-08-12",
    "id": 1786509690,
    "type": "error"
});