window.onPostDataLoaded({
    "title": "Fixing Vector DB Memory Exhaustion during HNSW Indexing",
    "slug": "vector-db-hnsw-memory-exhaustion",
    "language": "Python",
    "code": "OOM Error",
    "tags": [
        "Python",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) is the gold standard for vector search but is extremely memory-intensive during construction. The algorithm builds a multi-layered graph where each node (vector) must be kept in memory along with its neighbor links, leading to OOM (Out of Memory) crashes on large datasets.</p>",
    "root_cause": "The 'M' (max connections per element) and 'ef_construction' parameters grow the graph size exponentially. During construction, the system maintains both the raw vector data and the growing adjacency lists in RAM simultaneously.",
    "bad_code": "# High M and ef_construction values in FAISS\nindex = faiss.IndexHNSWFlat(d, 128) \nindex.hnsw.efConstruction = 400\nindex.add(massive_numpy_array) # Crashes here due to OOM",
    "solution_desc": "Implement memory-mapped storage (mmap) or reduce the 'M' parameter. Alternatively, use a two-stage approach: build the index on a machine with higher RAM and then load it as a read-only memory-mapped file.",
    "good_code": "# Use an IVF-HNSW approach or tune parameters for memory efficiency\nparam = \"HNSW32,Flat\"\nindex = faiss.index_factory(d, param)\n# Lowering ef_construction reduces RAM spike during build\nindex.hnsw.efConstruction = 128\nindex.add(massive_numpy_array)",
    "verification": "Monitor RSS (Resident Set Size) memory using 'top' or 'htop' during index.add() and ensure it stays below 90% of available RAM.",
    "date": "2026-04-15",
    "id": 1776230156,
    "type": "error"
});