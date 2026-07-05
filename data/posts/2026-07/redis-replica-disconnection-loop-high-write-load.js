window.onPostDataLoaded({
    "title": "Fixing Redis Replica Disconnection under High Load",
    "slug": "redis-replica-disconnection-loop-high-write-load",
    "language": "Redis",
    "code": "REPL_LOOP_ERR",
    "tags": [
        "Kubernetes",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under high write load, Redis master instances can fall into an infinite loop of replica disconnections and full resynchronizations. When write volume exceeds the capacity of the replication client output buffer (client-output-buffer-limit), the master forcefully disconnects the lagging replica. Once disconnected, the replica attempts to reconnect. Because the replication backlog (repl-backlog-size) has already rolled over due to the intense write traffic, a partial synchronization (PSYNC) is impossible, forcing a full resynchronization. The generation and transmission of the heavy RDB file blocks the network and consumer queue further, exceeding the buffer again, and repeating the cycle indefinitely.</p>",
    "root_cause": "The replication output buffer limit (client-output-buffer-limit replica) and replication backlog size are configured too low for the system's write throughput, causing immediate buffer overflow during heavy synchronization phases.",
    "bad_code": "# Bad configuration in redis.conf\n# Under high write loads, a 64MB buffer that is full for 60 seconds triggers a disconnect.\nclient-output-buffer-limit replica 256mb 64mb 60\nrepl-backlog-size 104857600 # 100MB backlog pool",
    "solution_desc": "Increase the replica output buffer configuration to allow massive buffer spikes during peak loads without triggering a connection tear-down. Additionally, raise the replication backlog size to give replicas a wider window to complete partial resynchronizations (PSYNC) instead of falling back to full RDB syncs.",
    "good_code": "# Optimized configuration in redis.conf\n# Set higher hard limit and softer temporal boundaries to prevent drops\nclient-output-buffer-limit replica 1024mb 512mb 300\nrepl-backlog-size 1073741824 # 1GB replication backlog\nrepl-diskless-sync yes\nrepl-diskless-sync-delay 5",
    "verification": "Monitor the replication link stability using 'redis-cli info replication'. Check the 'master_link_status' remains consistently 'up', and verify that 'sync_partial_ok' increments instead of 'sync_full' during intermittent spikes.",
    "date": "2026-07-05",
    "id": 1783217225,
    "type": "error"
});