window.onPostDataLoaded({
    "title": "Fixing Redis Replication Buffer Overflows and OOM",
    "slug": "redis-replication-buffer-overflow-oom",
    "language": "SQL",
    "code": "REPL_BUF_OOM",
    "tags": [
        "SQL",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput Redis clusters often suffer from Out-Of-Memory (OOM) kills or constant replication loops. When a master receives writes faster than a replica can consume them, the replication backlog (client output buffer for replicas) grows. If the buffer exceeds 'client-output-buffer-limit slave', the master terminates the connection. This triggers a full synchronization (PSYNC), creating an RDB snapshot that consumes massive RAM and I/O, often leading to a cascade of failures and OOM.</p>",
    "root_cause": "The client-output-buffer-limit for slaves is too low to accommodate the write-rate delta between the master and slow replicas during peak traffic.",
    "bad_code": "# Default redis.conf setting often too small\nclient-output-buffer-limit replica 256mb 64mb 60",
    "solution_desc": "Increase the replication buffer limits to accommodate peaks and switch to diskless replication to avoid I/O bottlenecks. Monitor the 'mem_clients_slaves' metric to right-size the memory allocation for the output buffers.",
    "good_code": "# Configuration for high-throughput write clusters\nclient-output-buffer-limit replica 1gb 512mb 120\nrepl-diskless-sync yes\nrepl-diskless-sync-delay 5",
    "verification": "Check 'redis-cli info replication' and ensure 'master_repl_offset' and 'slave_repl_offset' stay synchronized without frequent 'sync_full' increments in the logs.",
    "date": "2026-05-03",
    "id": 1777773439,
    "type": "error"
});