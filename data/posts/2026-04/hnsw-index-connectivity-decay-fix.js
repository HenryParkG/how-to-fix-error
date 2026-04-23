window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Connectivity Decay",
    "slug": "hnsw-index-connectivity-decay-fix",
    "language": "Python",
    "code": "Connectivity Decay",
    "tags": [
        "SQL",
        "Python",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small Worlds (HNSW) are the gold standard for vector similarity search. However, as items are incrementally added or deleted in a high-dimensional space, the graph structure suffers from 'Connectivity Decay.' This manifests as a significant drop in Recall@K and increased search latency. The graph effectively becomes fragmented, with newer nodes having fewer long-range connections to older layers, breaking the 'small world' property required for logarithmic search performance.</p>",
    "root_cause": "Repeated incremental updates and deletions lead to 'island' nodes and suboptimal edge distributions because standard HNSW insertion doesn't re-balance the entire graph for global optimality after the initial build.",
    "bad_code": "import hnswlib\nimport numpy as np\n\n# Standard HNSW setup\ndim = 128\nnum_elements = 10000\n\np = hnswlib.Index(space='l2', dim=dim)\np.init_index(max_elements=num_elements, ef_construction=200, M=16)\n\n# Problematic: Constant incremental additions and deletions without maintenance\nfor i in range(num_elements):\n    p.add_items(np.random.random((1, dim)), [i])\n    if i % 10 == 0:\n        p.mark_deleted(i - 5) # Deletions leave holes in the graph structure",
    "solution_desc": "The solution requires implementing a periodic 'Refactor and Rebuild' strategy or using a dynamic HNSW implementation that supports 'Repair on Delete.' This involves re-linking the neighbors of a deleted node to maintain the graph's expansion properties. Additionally, increasing the 'ef' (entry factor) during search can temporarily mask decay until a full re-index is performed.",
    "good_code": "import hnswlib\nimport numpy as np\n\ndef rebuild_index(old_index, dim):\n    # Extract valid IDs and data\n    ids = old_index.get_ids_list()\n    data = old_index.get_items(ids)\n    \n    # Initialize a clean index to restore connectivity integrity\n    new_index = hnswlib.Index(space='l2', dim=dim)\n    new_index.init_index(max_elements=len(ids) * 2, ef_construction=200, M=16)\n    new_index.add_items(data, ids)\n    return new_index\n\n# Usage: Trigger rebuild when recall drops below threshold\nif current_recall < 0.95:\n    p = rebuild_index(p, dim)",
    "verification": "Compare the Recall@K metric of a freshly built index versus one subjected to 10,000 incremental updates. If the delta exceeds 5%, a rebuild or repair cycle is required.",
    "date": "2026-04-23",
    "id": 1776908984,
    "type": "error"
});