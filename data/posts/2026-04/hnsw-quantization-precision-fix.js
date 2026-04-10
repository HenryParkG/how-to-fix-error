window.onPostDataLoaded({
    "title": "Mitigating Precision Loss in HNSW Quantization",
    "slug": "hnsw-quantization-precision-fix",
    "language": "Python",
    "code": "Accuracy Drop (Recall)",
    "tags": [
        "Python",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Hierarchical Navigable Small World (HNSW) graphs are the gold standard for vector search. However, as datasets scale to billions of vectors, memory becomes a bottleneck. Developers often turn to Product Quantization (PQ) to compress vectors from FP32 to 8-bit integers.</p><p>The issue is that aggressive quantization leads to 'precision loss,' where the distance calculation between the query and the quantized centroid no longer reflects the true nearest neighbors, causing a massive drop in Recall@K metrics.</p>",
    "root_cause": "Quantization noise where low-variance dimensions are over-compressed, leading to distance calculation collisions.",
    "bad_code": "import faiss\nindex = faiss.IndexHNSWPQ(d, 32, 16) # 16 sub-vectors\nindex.train(data)\nindex.add(data)\n# Returns results with low recall (e.g., 0.72)",
    "solution_desc": "Implement 'Oversampling' and 'Re-ranking'. Search for more candidates than needed (k * factor) using the quantized index, then re-calculate the exact distance for those candidates using the original uncompressed vectors stored on disk or in high-latency memory.",
    "good_code": "# Increase efSearch and use Re-ranking\nindex.hnsw.efSearch = 128\n# Search for 100 neighbors to find the best 10\nD, I = index.search(query_vector, 100)\n# Re-rank D, I using original vectors from a memory-mapped file\nfinal_results = rerank_with_original_vectors(query_vector, I)",
    "verification": "Compare Recall@10 before and after re-ranking. Expect recall to jump from ~0.7 to >0.95.",
    "date": "2026-04-10",
    "id": 1775815327,
    "type": "error"
});