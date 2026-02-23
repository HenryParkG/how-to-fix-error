window.onPostDataLoaded({
    "title": "Mitigating Redis Replication Buffer Overflows",
    "slug": "redis-replication-buffer-overflow",
    "language": "Redis",
    "code": "OOM-Replication",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When a Redis replica connects to a master, it performs a full synchronization. During this phase, the master buffers all new incoming writes into a 'replication buffer'. If the write volume is extremely high and the replica is slow to ingest the initial RDB file, this buffer can exceed the hard limit defined in 'client-output-buffer-limit slave', causing the master to disconnect the replica and restart the process in an infinite loop.</p>",
    "root_cause": "The replication buffer size is smaller than the delta of writes generated during the RDB transfer and loading phase.",
    "bad_code": "client-output-buffer-limit replica 256mb 64mb 60",
    "solution_desc": "Increase the replication buffer limits (hard and soft) in redis.conf to accommodate the high write throughput during synchronization periods.",
    "good_code": "client-output-buffer-limit replica 1gb 512mb 120",
    "verification": "Check 'info replication' and logs for 'Scheduled to resync' or 'Client id=... scheduled to be closed' errors.",
    "date": "2026-02-23",
    "id": 1771822402,
    "type": "error"
});