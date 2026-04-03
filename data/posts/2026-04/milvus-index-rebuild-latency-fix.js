window.onPostDataLoaded({
    "title": "Reducing Milvus Vector Index Rebuild Latency",
    "slug": "milvus-index-rebuild-latency-fix",
    "language": "Go",
    "code": "PerfFix",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput Milvus clusters, index rebuilding often triggers significant latency spikes in search operations. This happens because Milvus segments are immutable; once a segment reaches its size limit, it is flushed to disk and indexed. If multiple segments are indexed simultaneously, they consume CPU and I/O resources on the Index Nodes, competing with Query Nodes.</p><p>When the collection is large, the scheduling of index tasks becomes a bottleneck, and the time-to-search (latency from insertion to visibility) increases exponentially as the cluster struggles to keep up with the data flow.</p>",
    "root_cause": "Under-provisioned Index Nodes and improper segment sizing causing frequent, small-scale index rebuilds that saturate the gRPC control plane.",
    "bad_code": "{\n  \"index_type\": \"IVF_FLAT\",\n  \"params\": { \"nlist\": 1024 },\n  \"metric_type\": \"L2\",\n  \"segment_row_limit\": 4096 // Too small, causes excessive indexing cycles\n}",
    "solution_desc": "Increase the `segment_row_limit` to 512MB or 1GB to reduce the frequency of index tasks. Additionally, implement index node scaling and use 'MMap' for index files to offload memory pressure to the disk cache, allowing the Query Nodes to remain responsive during heavy indexing loads.",
    "good_code": "{\n  \"index_type\": \"HNSW\",\n  \"params\": { \"M\": 16, \"efConstruction\": 256 },\n  \"metric_type\": \"COSINE\",\n  \"segment_max_size\": 1073741824, // 1GB segments\n  \"mmap_enabled\": true \n}",
    "verification": "Monitor the 'index_node_latency' and 'query_node_sq_latency' metrics in Prometheus to ensure rebuilds do not exceed 200ms overhead.",
    "date": "2026-04-03",
    "id": 1775179638,
    "type": "error"
});