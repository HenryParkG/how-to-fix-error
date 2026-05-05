window.onPostDataLoaded({
    "title": "Mitigating Elasticsearch Shard Deadlocks",
    "slug": "mitigating-elasticsearch-shard-deadlocks",
    "language": "Java",
    "code": "ShardAllocationDeadlock",
    "tags": [
        "Elasticsearch",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch employs 'watermarks' to prevent disk exhaustion. When a node reaches the 'high watermark' (default 90%), ES stops allocating new shards to that node. A deadlock occurs in small or unbalanced clusters when every node exceeds this threshold simultaneously. The cluster attempts to move shards to rebalance, but since every node is above the limit, the move is rejected, leaving the cluster in a 'Red' state where no shards can be assigned or moved, even if disk space is manually cleared.</p>",
    "root_cause": "The cluster reaches the 'flood_stage' watermark across all nodes, causing a global block on shard allocation and index writes that prevents the rebalancing logic from executing.",
    "bad_code": "PUT _cluster/settings\n{\n  \"transient\": {\n    \"cluster.routing.allocation.disk.watermark.high\": \"95%\",\n    \"cluster.routing.allocation.disk.watermark.flood_stage\": \"98%\"\n  }\n}",
    "solution_desc": "Manually override the disk watermarks temporarily to allow the master node to initiate shard movement. Once shards are rebalanced or disk space is expanded, restore the original limits and ensure 'cluster.routing.allocation.total_shards_per_node' is configured to prevent future uneven distribution.",
    "good_code": "PUT _cluster/settings\n{\n  \"transient\": {\n    \"cluster.routing.allocation.disk.threshold_enabled\": false,\n    \"index.blocks.read_only_allow_delete\": null\n  }\n}",
    "verification": "Check the health of the cluster using `GET _cluster/health` and verify that `unassigned_shards` count drops to zero after applying the transient settings.",
    "date": "2026-05-05",
    "id": 1777976921,
    "type": "error"
});