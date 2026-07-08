window.onPostDataLoaded({
    "title": "Mitigating HNSW Index Construction Memory OOM",
    "slug": "hnsw-index-oom-memory-saturation",
    "language": "Python",
    "code": "Out of Memory",
    "tags": [
        "Python",
        "Backend",
        "Databases",
        "Error Fix"
    ],
    "analysis": "<p>Constructing Hierarchical Navigable Small World (HNSW) graphs for vector search is highly memory-intensive. During index building, memory saturation (OOM) often occurs because the entire graph structure, vector points, and routing tables must reside in RAM simultaneously. High 'M' (max outgoing connections per node) and 'ef_construction' (depth of the entry points search) values scale memory usage quadratically.</p>",
    "root_cause": "The allocator cannot handle the massive surge in concurrent heap allocations during the parallel insertion of vectors, exacerbated by oversized hyper-parameters (M and ef_construction) which dramatically increase the number of edges stored in memory.",
    "bad_code": "import hnswlib\nimport numpy as np\n\ndim = 1536\nnum_elements = 1000000\ndata = np.random.randn(num_elements, dim).astype(np.float32)\n\n# UNSAFE: Extremely high M and ef_construction leading to OOM on standard instances\np = hnswlib.Index(space='l2', dim=dim)\np.init_index(max_elements=num_elements, ef_construction=500, M=64)",
    "solution_desc": "Optimize the 'M' and 'ef_construction' trade-offs, implement batch insertion to allow garbage collection of temporary buffer objects, and consider using scalar quantization (SQ) or product quantization (PQ) to reduce the vector footprint during construction.",
    "good_code": "import hnswlib\nimport numpy as np\n\ndim = 1536\nnum_elements = 1000000\ndata = np.random.randn(num_elements, dim).astype(np.float32)\n\n# SAFE: Balanced parameters with batching\np = hnswlib.Index(space='l2', dim=dim)\np.init_index(max_elements=num_elements, ef_construction=200, M=16)\n\n# Insert in batches to prevent sudden memory spikes\nbatch_size = 50000\nfor i in range(0, num_elements, batch_size):\n    p.add_items(data[i:i+batch_size], np.arange(i, i+len(data[i:i+batch_size])))",
    "verification": "Monitor memory utilization using tools like 'valgrind' or 'mprof' during execution, verifying that RSS memory remains stable and bounded within system limits.",
    "date": "2026-07-08",
    "id": 1783498269,
    "type": "error"
});