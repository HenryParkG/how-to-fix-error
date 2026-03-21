window.onPostDataLoaded({
    "title": "Solving Recall Loss During HNSW Index Compaction",
    "slug": "hnsw-recall-degradation-fix",
    "language": "Go",
    "code": "Recall_Degradation",
    "tags": [
        "Go",
        "SQL",
        "VectorDB",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) indices rely on a delicate balance of graph connectivity. During compaction\u2014the process of removing deleted 'tombstone' vectors\u2014many implementations simply remove nodes and re-link neighbors. However, this often leads to 'island' formations or increased graph diameter.</p><p>As the index grows and undergoes multiple compaction cycles, the probability of the search algorithm getting stuck in a local minimum increases, leading to a significant drop in recall (the percentage of true nearest neighbors found).</p>",
    "root_cause": "Naive neighbor re-linking during node deletion fails to maintain the 'Small World' property, effectively breaking the navigational highways between different layers of the HNSW graph.",
    "bad_code": "func compact(graph *HNSW) {\n  for _, node := range graph.Tombstones {\n    neighbors := node.Neighbors\n    for _, n := range neighbors {\n       n.RemoveLink(node)\n       // Missing: Re-evaluating M-max connections for orphans\n    }\n    graph.Delete(node)\n  }\n}",
    "solution_desc": "Implement a 'Re-entry Search' during compaction. When a node is removed, its neighbors should not just be cross-linked; instead, a subset of them should perform a new search to find the most optimal 'replacement' neighbors at each layer, maintaining the M and efConstruction constraints.",
    "good_code": "func repairGraph(graph *HNSW, orphanedNode *Node) {\n  for _, neighbor := range orphanedNode.Neighbors {\n    // Re-run search to find optimal connections to maintain connectivity\n    newNeighbors := graph.SearchLayer(neighbor.Vec, layer, M)\n    neighbor.UpdateLinks(newNeighbors)\n  }\n}",
    "verification": "Measure Recall@K before and after 1000 delete-and-compact cycles using a gold-standard ground truth set.",
    "date": "2026-03-21",
    "id": 1774074753,
    "type": "error"
});