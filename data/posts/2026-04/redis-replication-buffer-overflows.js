window.onPostDataLoaded({
    "title": "Fixing Redis Replication Buffer Overflows",
    "slug": "redis-replication-buffer-overflows",
    "language": "Redis",
    "code": "ReplicaDisconnect",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In high-write Redis clusters, the replication backlog and output buffers can quickly fill up. When a master node receives writes faster than it can stream them to its replicas, the 'client-output-buffer-limit' for 'replica' is reached. Redis then forcibly disconnects the replica, triggering a full synchronization (PSYNC) which puts even more load on the master, often leading to a 'death spiral' of constant re-syncs.</p>",
    "root_cause": "The default 'client-output-buffer-limit replica' setting is too low (typically 256MB) for workloads exceeding 50MB/s of write traffic, especially over high-latency networks.",
    "bad_code": "client-output-buffer-limit replica 256mb 64mb 60\n# This disconnects if 256MB total is hit OR 64MB is held for 60s",
    "solution_desc": "Increase the replication buffer limits in redis.conf to accommodate the write throughput and network jitter. Additionally, increase the 'repl-backlog-size' to allow for longer partial resynchronizations (PSYNC).",
    "good_code": "client-output-buffer-limit replica 1gb 512mb 120\nrepl-backlog-size 512mb\nrepl-timeout 120",
    "verification": "Monitor 'redis_cli info replication' and 'redis_cli info stats'. Check for the 'sync_partial_err' and 'master_link_down_since_seconds' metrics to ensure stable connections during peak write loads.",
    "date": "2026-04-26",
    "id": 1777196711,
    "type": "error"
});