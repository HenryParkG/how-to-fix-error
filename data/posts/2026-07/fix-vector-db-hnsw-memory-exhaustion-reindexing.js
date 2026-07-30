window.onPostDataLoaded({
    "title": "Fix Vector DB HNSW Memory Exhaustion in Reindexing",
    "slug": "fix-vector-db-hnsw-memory-exhaustion-reindexing",
    "language": "Python",
    "code": "HNSWMemoryExhaustion",
    "tags": [
        "Python",
        "Backend",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs construct proximity layers across high-dimensional vectors for fast nearest-neighbor searches. During dynamic full reindexing or batch vector insertion, holding uncompressed 1536-dimensional float32 vectors alongside expanding graph edges ($M$) triggers extreme process resident set size (RSS) memory consumption, leading to system OOM (Out-Of-Memory) kernel kills.</p>",
    "root_cause": "Unbounded memory allocation during full-graph edge expansion with unquantized float32 vectors and high construction depth parameters.",
    "bad_code": "import hnswlib\nimport numpy as np\n\n# Uncompressed 1536-dim vector indexing causing OOM on bulk write\ndim = 1536\nnum_elements = 1000000\ndata = np.random.map(np.float32, np.random.randn(num_elements, dim))\n\np = hnswlib.Index(space='l2', dim=dim)\n# BUG: High M and ef_construction on raw float32 consumes ~30GB RAM instantly\np.init_index(max_elements=num_elements, ef_construction=400, M=64)\np.add_items(data)",
    "solution_desc": "Apply Scalar Quantization (SQ8) or Product Quantization (PQ) to reduce vector memory footprint by up to 75%. Tune $M$ and $efConstruction$ parameters, and process index generation in streamed chunked batches to control peak RSS usage.",
    "good_code": "import faiss\nimport numpy as np\n\ndim = 1536\nnum_elements = 1000000\ndata = np.random.randn(num_elements, dim).astype('float32')\n\n# FIX: Use Scalar Quantization (SQ8) + HNSW to constrain memory overhead\nquantizer = faiss.IndexFlatL2(dim)\n# 32 edges per node with SQ8 compression\nindex = faiss.IndexHNSWScalarQuantizer(dim, faiss.ScalarQuantizer.QT_8bit, 32)\n\n# Train and add items in controlled memory chunks\nindex.train(data[:50000])\nfor i in range(0, num_elements, 100000):\n    index.add(data[i:i + 100000])",
    "verification": "Track memory consumption using `psutil` or `valgrind` during index creation to ensure RSS stays strictly bounded under assigned memory limits (e.g., < 8 GB).",
    "date": "2026-07-30",
    "id": 1785389490,
    "type": "error"
});