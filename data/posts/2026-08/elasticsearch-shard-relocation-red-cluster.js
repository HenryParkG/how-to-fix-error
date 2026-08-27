window.onPostDataLoaded({
    "title": "Fix Elasticsearch Shard Relocation Failure & Red State",
    "slug": "elasticsearch-shard-relocation-red-cluster",
    "language": "Kubernetes",
    "code": "ClusterBlockException",
    "tags": [
        "Elasticsearch",
        "Kubernetes",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>An Elasticsearch cluster enters a <code>RED</code> status when one or more primary shards fail to allocate. During node scale-down, pod restarts in Kubernetes, or EBS volume re-attachments, shard relocation can repeatedly fail if disk thresholds hit the <code>cluster.routing.allocation.disk.watermark.flood_stage</code> (default 95%). Once an unassigned shard exceeds <code>index.allocation.max_retries</code> (default 5), Elasticsearch ceases automatic recovery attempts and marks the index read-only with a <code>ClusterBlockException</code>.</p>",
    "root_cause": "Node storage breach beyond the flood-stage watermark tripping the global read-only index block coupled with retry count exhaustion on primary shard allocation.",
    "bad_code": "PUT /_cluster/settings\n{\n  \"transient\": {\n    \"cluster.routing.allocation.enable\": \"none\"\n  }\n}\n# Attempting destructive unassigned delete or incorrect reroute blindly:\nPOST /_cluster/reroute\n{\n  \"commands\": [\n    {\n      \"allocate_empty_primary\": {\n        \"index\": \"production-logs-2024.03\",\n        \"shard\": 0,\n        \"node\": \"es-data-node-1\",\n        \"accept_data_loss\": true\n      }\n    }\n  ]\n}",
    "solution_desc": "Diagnose root cause via the allocation explain API, free up storage, temporarily adjust disk thresholds if safe, reset the index retry counters, release the index read-only flood-stage block, and trigger a non-destructive primary allocation.",
    "good_code": "# 1. Inspect exact allocation failure reason\nPOST /_cluster/allocation/explain\n{\n  \"index\": \"production-logs-2024.03\",\n  \"shard\": 0,\n  \"primary\": true\n}\n\n# 2. Clear the flood-stage read-only block\nPUT /production-logs-2024.03/_settings\n{\n  \"index.blocks.read_only_allow_delete\": null,\n  \"index.allocation.max_retries\": 10\n}\n\n# 3. Retry allocation with stale primary fallback if replica holds data\nPOST /_cluster/reroute?retry_failed=true\n{\n  \"commands\": [\n    {\n      \"allocate_stale_primary\": {\n        \"index\": \"production-logs-2024.03\",\n        \"shard\": 0,\n        \"node\": \"data-pod-2.elasticsearch.default.svc.cluster.local\",\n        \"accept_data_loss\": false\n      }\n    }\n  ]\n}",
    "verification": "Run `GET /_cluster/health` to confirm the cluster status changes to `GREEN` or `YELLOW` and execute `GET /_cat/shards?v&h=index,shard,prirep,state,unassigned.reason` to verify all primary shards are `STARTED`.",
    "date": "2026-08-27",
    "id": 1787851311,
    "type": "error"
});