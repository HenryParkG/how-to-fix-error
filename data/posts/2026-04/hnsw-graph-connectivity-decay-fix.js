window.onPostDataLoaded({
    "title": "Fixing HNSW Graph Connectivity Decay in Vector DBs",
    "slug": "hnsw-graph-connectivity-decay-fix",
    "language": "Python",
    "code": "GraphFragmentation",
    "tags": [
        "Python",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>High-volume document deletions in HNSW-based vector databases (like Milvus or Weaviate) often lead to 'Graph Decay.' In HNSW, nodes are connected in a multi-layered navigable small-world graph. When a node is deleted, standard implementations often mark it as 'tombstoned' rather than physically restructuring the graph.</p><p>Over time, these 'holes' break the navigational paths, forcing search algorithms to perform more jumps or fail to reach relevant clusters, resulting in a significant drop in recall and increased latency.</p>",
    "root_cause": "The deletion process removes edges without re-connecting the neighbors of the deleted node, leading to isolated subgraphs and broken entry points in the upper layers of the HNSW structure.",
    "bad_code": "# Simple logical deletion that causes decay\ndef delete_vector(vector_id):\n    index.mark_deleted(vector_id) \n    # No re-linking logic, graph becomes sparse",
    "solution_desc": "Implement an 'Incremental Graph Rebuild' or 'Repair-on-Delete' strategy. When a node is removed, its neighbors from the same layer must be re-evaluated and potentially linked to each other to maintain the 6-degrees-of-separation property.",
    "good_code": "def robust_delete(node_id):\n    neighbors = index.get_all_neighbors(node_id)\n    index.physical_remove(node_id)\n    for n in neighbors:\n        # Re-run the neighbor selection algorithm for affected nodes\n        new_links = index.search_layer(n.vector, layer=n.layer, ef=20)\n        index.update_connections(n, new_links)",
    "verification": "Monitor the 'Mean Recall' metric and 'Average Hop Count' during search operations. A steady increase in hop count despite constant data size indicates connectivity decay.",
    "date": "2026-04-18",
    "id": 1776488478,
    "type": "error"
});