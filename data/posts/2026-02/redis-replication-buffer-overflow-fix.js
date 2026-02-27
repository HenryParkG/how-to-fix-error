window.onPostDataLoaded({
    "title": "Fixing Redis Replication Buffer Overflows",
    "slug": "redis-replication-buffer-overflow-fix",
    "language": "Redis, Go",
    "code": "REPL_BUF_OVERFLOW",
    "tags": [
        "Go",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In high-write geographic failover scenarios, the latency between the primary and the cross-region replica causes the replication buffer to grow rapidly. If the write volume exceeds the buffer's capacity before it can be flushed to the replica, Redis terminates the connection and triggers a full resync, creating a loop of performance degradation.</p>",
    "root_cause": "The 'client-output-buffer-limit replica' setting is too low for the network bandwidth-delay product of a cross-region link.",
    "bad_code": "client-output-buffer-limit replica 256mb 64mb 60",
    "solution_desc": "Increase the replication buffer limit and the replication backlog size. This allows the replica more time to consume data during transient network spikes without triggering a full synchronization (PSYNC).",
    "good_code": "config set client-output-buffer-limit 'replica 1gb 512mb 60'\nconfig set repl-backlog-size 1gb",
    "verification": "Execute 'INFO replication' and monitor 'master_repl_offset' vs 'slave_repl_offset' to ensure they stay synced without resets.",
    "date": "2026-02-27",
    "id": 1772166692,
    "type": "error"
});