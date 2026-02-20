window.onPostDataLoaded({
    "title": "Mitigating HNSW Graph Decay in Vector DBs",
    "slug": "hnsw-index-connectivity-decay",
    "language": "Python",
    "code": "RecallDrop",
    "tags": [
        "Python",
        "Backend",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) indexes are highly efficient for ANN search but suffer from 'graph decay' during incremental updates. When vectors are deleted or updated, the edges connecting nodes in the multi-layered graph are removed. Without a repair mechanism, this creates 'island' nodes or reduces the path diversity, leading to a significant drop in search recall over time despite the index containing the correct data.</p>",
    "root_cause": "Standard HNSW implementations often perform 'soft deletes' or simple edge removal without re-evaluating the M-closest neighbors for orphaned nodes, leading to a fragmented graph topology.",
    "bad_code": "import hnswlib\nindex = hnswlib.Index(space='l2', dim=128)\nindex.init_index(max_elements=10000)\n\n# Frequent updates lead to decay\nfor i in range(1000):\n    index.mark_deleted(i)\n    index.add_items(new_vector, i)",
    "solution_desc": "Implement a 'Repair-on-Update' strategy or periodic background compaction. Instead of just marking nodes as deleted, use a library that supports dynamic edge re-linking or trigger a partial rebuild of the affected neighborhood. For production systems, tracking the 'Mean Connectivity' metric helps determine when to trigger a full index optimization.",
    "good_code": "# Use a managed approach with edge repair\ndef update_vector(index, id, vector):\n    # Some implementations support explicit repair\n    # If not, use a threshold-based rebuild\n    index.mark_deleted(id)\n    index.add_items(vector, id)\n    \n    if index.get_deleted_count() > index.get_capacity() * 0.2:\n        # Rebuild index to restore global connectivity\n        index.compact_and_repair()",
    "verification": "Monitor the Recall@K metric against a golden dataset after 10,000 incremental updates. If recall stays within 1% of the initial state, the mitigation is successful.",
    "date": "2026-02-20",
    "id": 1771569849,
    "type": "error"
});