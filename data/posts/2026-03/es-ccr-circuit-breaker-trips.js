window.onPostDataLoaded({
    "title": "Eliminating ES Circuit Breaker Trips during CCR",
    "slug": "es-ccr-circuit-breaker-trips",
    "language": "Java",
    "code": "CircuitBreakerException",
    "tags": [
        "Elasticsearch",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch Cross-Cluster Replication (CCR) relies on background tasks to 'pull' shards from a leader cluster to a follower cluster. Under heavy write loads, the 'request' circuit breaker often trips because the follower node attempts to buffer too many replication requests in memory simultaneously. This results in the error: [parent] Data too large, which halts replication and causes the follower to fall behind.</p><p>The default settings often prioritize replication speed over heap stability, leading to scenarios where the memory used by the 'inflight' replication fetches exceeds the breaker limit, especially when using nodes with smaller heap sizes.</p>",
    "root_cause": "The `indices.breaker.request.limit` (default 60%) is exceeded because the CCR follower is configured to handle too many concurrent read requests (`max_outstanding_read_requests`) with a large buffer per request.",
    "bad_code": "PUT /follower_index/_ccr/follow\n{\n  \"remote_cluster\": \"leader_cluster\",\n  \"leader_index\": \"leader_index\",\n  \"max_outstanding_read_requests\": 1024, \n  \"max_read_request_size\": \"64mb\"\n}",
    "solution_desc": "Reduce the pressure on the request breaker by lowering the `max_outstanding_read_requests` and `max_read_request_size`. Simultaneously, increase the CCR-specific throttles to ensure that the cumulative memory footprint of all following indices does not exceed the JVM heap capacity dedicated to requests.",
    "good_code": "PUT /follower_index/_ccr/follow\n{\n  \"remote_cluster\": \"leader_cluster\",\n  \"leader_index\": \"leader_index\",\n  \"max_outstanding_read_requests\": 16,\n  \"max_read_request_size\": \"16mb\",\n  \"max_outstanding_write_requests\": 8,\n  \"max_write_buffer_count\": 512\n}",
    "verification": "Monitor the `_nodes/stats/breaker` API. The 'request' breaker `tripped` count should remain static. Check `_ccr/stats` to ensure the `time_since_last_read_millis` is not growing indefinitely.",
    "date": "2026-03-20",
    "id": 1773988983,
    "type": "error"
});