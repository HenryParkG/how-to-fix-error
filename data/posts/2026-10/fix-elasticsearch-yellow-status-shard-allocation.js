window.onPostDataLoaded({
    "title": "Fix Elasticsearch Yellow Status & Shard Allocation",
    "slug": "fix-elasticsearch-yellow-status-shard-allocation",
    "language": "Elasticsearch",
    "code": "ElasticsearchYellowStatus",
    "tags": [
        "Java",
        "Docker",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>An Elasticsearch cluster enters a `yellow` health state when all primary shards are successfully allocated, but one or more replica shards remain in an `UNASSIGNED` state. While read and write traffic to primary shards can still proceed, cluster fault tolerance is compromised. A sudden node outage in a yellow state risks immediate data unavailability or permanent loss.</p><p>The root causes of persistent shard allocation failures typically converge on cluster disk watermarks and severe disk I/O bottlenecks. Elasticsearch enforces three default disk watermarks: low (85%), high (90%), and flood stage (95%). Once a node surpasses the low watermark, the master node refuses to allocate replica shards to that node. If multiple nodes exceed this threshold, or if high disk I/O latency causes shard assignment handshakes and translog syncs to exceed allocation timeout windows (`indices.recovery.max_bytes_per_sec`), shards remain stuck in an unassigned state with allocation retry counters exhausted.</p>",
    "root_cause": "Replica shards cannot be allocated because storage utilization on target data nodes breached the `cluster.routing.allocation.disk.watermark.low` limit, compounded by I/O write starvation aborting recovery tasks.",
    "bad_code": "# Current cluster state check reveals UNASSIGNED replicas due to disk watermark\nGET /_cluster/allocation/explain\n{\n  \"index\": \"logs-2024.03\",\n  \"shard\": 0,\n  \"primary\": false\n}\n\n# Response snippet showing failure:\n# \"deciders\": [\n#   {\n#     \"decider\": \"disk_threshold\",\n#     \"decision\": \"NO\",\n#     \"explanation\": \"the node is above the low watermark, free space: 14.1gb[14.2%], below threshold: 15.0%\"\n#   }\n# ]",
    "solution_desc": "Diagnose the allocation failure using the Cluster Allocation Explain API. Remediate storage pressure by cleaning up expired indices, expanding storage volumes, or adjusting the watermark thresholds if adequate headroom exists. Reset allocation retries on stalled indices and throttle recovery bandwidth to prevent I/O saturation from blocking primary operations.",
    "good_code": "# 1. Dynamically update disk watermark thresholds to restore scheduling capacity\nPUT /_cluster/settings\n{\n  \"persistent\": {\n    \"cluster.routing.allocation.disk.watermark.low\": \"90%\",\n    \"cluster.routing.allocation.disk.watermark.high\": \"94%\",\n    \"cluster.routing.allocation.disk.watermark.flood_stage\": \"96%\",\n    \"cluster.info.update.interval\": \"1m\"\n  }\n}\n\n# 2. Bound recovery I/O throughput to eliminate disk contention\nPUT /_cluster/settings\n{\n  \"persistent\": {\n    \"indices.recovery.max_bytes_per_sec\": \"50mb\",\n    \"cluster.routing.allocation.cluster_concurrent_rebalance\": 2,\n    \"cluster.routing.allocation.node_concurrent_recoveries\": 2\n  }\n}\n\n# 3. Explicitly trigger retry for unassigned shards stuck after failure limit\nPOST /_cluster/reroute?retry_failed=true",
    "verification": "Execute `GET /_cluster/health` to confirm status changes from `yellow` to `green`. Verify that `unassigned_shards` decrements to 0 via `GET /_cat/shards?v&h=index,shard,prirep,state,unassigned.reason`.",
    "date": "2026-10-27",
    "id": 1793090756,
    "type": "error"
});