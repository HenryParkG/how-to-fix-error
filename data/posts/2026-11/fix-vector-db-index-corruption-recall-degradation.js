window.onPostDataLoaded({
    "title": "Fix Vector DB Index Corruption & Recall Degradation",
    "slug": "fix-vector-db-index-corruption-recall-degradation",
    "language": "Python",
    "code": "INDEX_DEGRADATION",
    "tags": [
        "Python",
        "VectorDB",
        "HNSW",
        "Error Fix"
    ],
    "analysis": "<p>In real-time retrieval-augmented generation (RAG) and semantic search systems, continuously applying vector updates, upserts, and hard deletes corrupts graph-based vector indexes (such as HNSW). In-place deletions remove nodes from multi-layer graphs, leaving orphaned neighbor pointers and breaking graph reachability. Over time, search queries fail to traverse deeper layers, resulting in recall dropping from 98% down to sub-60%.</p><p>Furthermore, asynchronous index merges during continuous write workloads often trigger segment metadata mismatches, causing vector databases to return stale references or throw dimensional assertion errors during similarity computations.</p>",
    "root_cause": "Frequent real-time hard deletes disrupt HNSW graph connectivity by severing bridge edges, while segment compaction starvation leads to unpruned tombstone accumulation and corrupted index traversals.",
    "bad_code": "import numpy as np\nimport faiss\n\nd = 128\nindex = faiss.IndexHNSWFlat(d, 32)\nindex.add(np.random.random((10000, d)).astype('float32'))\n\n# Bug: Repeated arbitrary ID removal breaks graph traversal paths\n# FAISS HNSW does not natively maintain balanced recall under frequent remove_ids\nremove_ids = np.array([12, 45, 99, 1024, 2048])\nindex.remove_ids(faiss.IDSelectorArray(len(remove_ids), faiss.swig_ptr(remove_ids)))\n# Immediate search without graph compaction yields degraded recall",
    "solution_desc": "Decouple real-time modifications into a write-ahead log (WAL) with logical tombstoning instead of immediate in-place graph deletion. Implement an automated background compaction policy that monitors recall against a reference dataset and performs full index rebuilds on immutable segments once fragmentation exceeds 15%.",
    "good_code": "import numpy as np\nimport faiss\n\nclass ResilientVectorStore:\n    def __init__(self, dim=128, m=32):\n        self.dim = dim\n        self.m = m\n        self.index = faiss.IndexHNSWFlat(dim, m)\n        self.tombstones = set()\n        self.vectors = {}\n\n    def upsert(self, doc_id: int, vec: np.ndarray):\n        self.vectors[doc_id] = vec\n        self.tombstones.discard(doc_id)\n        self.index.add(np.expand_dims(vec, axis=0))\n\n    def soft_delete(self, doc_id: int):\n        self.tombstones.add(doc_id)\n        # Trigger compaction if tombstone ratio exceeds 15%\n        if len(self.tombstones) / max(len(self.vectors), 1) > 0.15:\n            self.rebuild_index()\n\n    def rebuild_index(self):\n        for tid in self.tombstones:\n            self.vectors.pop(tid, None)\n        self.tombstones.clear()\n        new_index = faiss.IndexHNSWFlat(self.dim, self.m)\n        if self.vectors:\n            active_vectors = np.array(list(self.vectors.values())).astype('float32')\n            new_index.add(active_vectors)\n        self.index = new_index",
    "verification": "Evaluate 100 test queries against a brute-force `IndexFlatL2` ground truth baseline. Ensure that recall@10 remains >= 0.98 before and after executing 10,000 upsert and delete operations.",
    "date": "2026-11-05",
    "id": 1793887079,
    "type": "error"
});