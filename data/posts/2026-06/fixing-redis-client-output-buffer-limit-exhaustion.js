window.onPostDataLoaded({
    "title": "Fixing Redis Client Output Buffer Limit Exhaustion",
    "slug": "fixing-redis-client-output-buffer-limit-exhaustion",
    "language": "Go",
    "code": "OOM / COBL Replication Loop",
    "tags": [
        "Go",
        "Docker",
        "Redis",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>The Redis Client Output Buffer Limit (COBL) controls memory allocation for clients that read slower than the rate at which Redis writes data. During high-throughput write operations, replica connections can fall behind. If the replica's buffer exceeds the configured hard limit (e.g., 256MB) or stays above the soft limit (e.g., 64MB for 60 seconds), the Redis master abruptly terminates the replica's connection.</p><p>This disconnection triggers a reconnection, which forces a full synchronization (PSYNC/SYNC). The full synchronization writes a new RDB file and sends it to the replica. During this sync, incoming write commands accumulate in the output buffer. If the synchronization takes too long or writes continue at a high rate, the buffer is exhausted again, causing a continuous replication loop death spiral that degrades performance and leads to out-of-memory crashes.</p>",
    "root_cause": "The replica's client output buffer limit is configured too low relative to the write volume, combined with an inadequate replication backlog allocation.",
    "bad_code": "# Inadequate Redis Configuration in redis.conf\nclient-output-buffer-limit normal 0 0 0\nclient-output-buffer-limit replica 256mb 64mb 60\nclient-output-buffer-limit pubsub 32mb 8mb 60\nrepl-backlog-size 1mb",
    "solution_desc": "Increase the replica Client Output Buffer Limit (COBL) to handle bursts of write commands during full synchronization. Expand the replication backlog size to prevent full synchronization when reconnecting.",
    "good_code": "# Optimized Redis Configuration in redis.conf\nclient-output-buffer-limit normal 0 0 0\n# Scale limits to allow 1GB hard limit and 512MB soft limit for stable sync transitions\nclient-output-buffer-limit replica 1gb 512mb 120\nclient-output-buffer-limit pubsub 128mb 64mb 60\n# Increase replication backlog to allow replicas to perform partial sync (PSYNC)\nrepl-backlog-size 256mb",
    "verification": "Run `redis-cli info replication` and verify that `sync_partial_err` does not increment after network disruptions. Run `redis-cli client list` during peak write load to monitor the `omem` (output buffer memory) metric and ensure it stays below the limit.",
    "date": "2026-06-21",
    "id": 1782026860,
    "type": "error"
});