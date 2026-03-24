window.onPostDataLoaded({
    "title": "Elasticsearch: Fixing Ghost Shard Metadata Inconsistencies",
    "slug": "elasticsearch-ghost-shard-metadata-fix",
    "language": "Java",
    "code": "Metadata-Mismatch",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Ghost shards occur in large Elasticsearch clusters when the cluster state metadata references a shard that does not physically exist on any node, or when the routing table is out of sync with the actual shard store. This usually happens after a series of rapid master elections or network partitions where the 'tombstone' for a deleted index fails to propagate. The cluster remains in a 'Red' status because it attempts to assign a shard that has no data source, effectively blocking rebalancing and preventing new indices from being initialized correctly.</p>",
    "root_cause": "The cluster state version incremented without successfully clearing the routing table entry for a shard during a node departure, leaving a dangling reference in the ClusterState.",
    "bad_code": "PUT /_cluster/settings\n{\n  \"transient\": {\n    \"cluster.routing.allocation.enable\": \"none\" \n  }\n} // This hides the problem but doesn't clear the metadata",
    "solution_desc": "The metadata must be forcibly reconciled. Use the Cluster Reroute API with the 'retry_failed' flag. If the shard is truly lost and has no replica, the index may need to be closed and reopened, or the specific 'stale' shard must be removed using the 'allocate_empty_primary' command with extreme caution to reset the metadata state.",
    "good_code": "POST /_cluster/reroute?retry_failed=true\n{\n  \"commands\": [\n    {\n      \"allocate_empty_primary\": {\n        \"index\": \"my-ghost-index\",\n        \"shard\": 0,\n        \"node\": \"node-01\",\n        \"accept_data_loss\": true\n      }\n    }\n  ]\n}",
    "verification": "Execute 'GET /_cluster/health' to ensure the status returns to 'Green' or 'Yellow' and check 'GET /_cat/shards' to verify no 'UNASSIGNED' shards remain with 'ALLOCATION_FAILED' errors.",
    "date": "2026-03-24",
    "id": 1774327710,
    "type": "error"
});