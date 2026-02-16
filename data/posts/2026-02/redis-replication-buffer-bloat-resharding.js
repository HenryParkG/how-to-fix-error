window.onPostDataLoaded({
    "title": "Fixing Redis Replication Buffer Bloat in Resharding",
    "slug": "redis-replication-buffer-bloat-resharding",
    "language": "C",
    "code": "OOM-Kill",
    "tags": [
        "Docker",
        "Go",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>During Redis Cluster resharding, the <code>MIGRATE</code> command moves keys between shards. Under heavy write load, the source node's replication buffer for its replicas can grow uncontrollably. This is because the <code>MIGRATE</code> command is a blocking operation on the main thread, and while it processes, incoming writes are buffered. If the resharding involves large keys (e.g., massive HASH or SET types), the buffer eventually exceeds <code>client-output-buffer-limit slave</code>, causing replica disconnection and a subsequent 'sync-storm' that can crash the node.</p>",
    "root_cause": "High-latency key migration blocking the main thread while high-frequency writes fill the output buffer, exceeding the hard limit for replicas.",
    "bad_code": "# Default conservative limits in redis.conf\nclient-output-buffer-limit replica 256mb 64mb 60\n# Standard resharding command\nredis-cli --cluster reshard <host>:<port>",
    "solution_desc": "Temporarily increase the replication buffer limits during maintenance and use the <code>ASYNC</code> flag for the MIGRATE command (available in Redis 4.0+). Additionally, implement pipeline-based resharding to reduce the time the main thread is blocked.",
    "good_code": "# Increase buffer limits dynamically before resharding\nCONFIG SET client-output-buffer-limit \"replica 1gb 512mb 60\"\n\n# Use ASYNC migration if scripting custom resharding\n# MIGRATE host port key destination-db timeout [COPY] [REPLACE] [ASYNC]",
    "verification": "Use 'INFO Clients' to monitor 'client_recent_max_output_buffer' and ensure 'slaves' disconnection count remains zero during the resharding process.",
    "date": "2026-02-16",
    "id": 1771204676,
    "type": "error"
});