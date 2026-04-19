window.onPostDataLoaded({
    "title": "Fixing HNSW Recall Degradation in Vector Databases",
    "slug": "hnsw-recall-degradation-fix",
    "language": "Python",
    "code": "RecallDrift",
    "tags": [
        "Python",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>HNSW (Hierarchical Navigable Small World) graphs are sensitive to high-churn environments. As vectors are deleted or updated, the small-world graph can become fragmented or 'orphaned,' causing the search algorithm to miss optimal clusters. This manifests as a significant drop in recall compared to the initial index creation state.</p>",
    "root_cause": "Graph fragmentation caused by excessive 'tombstone' deletions and sub-optimal 'ef_search' parameters that fail to account for increased index entropy.",
    "bad_code": "index = faiss.IndexHNSWFlat(d, 32)\nindex.add(data)\n# Recall drops after 100k updates\nresults = index.search(query, k=10)",
    "solution_desc": "Trigger a periodic index rebuild or 'compaction' when the deletion ratio exceeds 20%, and dynamically increase the 'efSearch' parameter to broaden the search breadth during high-entropy states.",
    "good_code": "index.hnsw.efSearch = 128 # Increase breadth\nif deleted_count / total > 0.2:\n    new_index = faiss.IndexHNSWFlat(d, 32)\n    new_index.add(current_vectors)\n    index = new_index",
    "verification": "Calculate the ratio of shared neighbors between an exact brute-force search (FlatIndex) and the HNSW index to ensure recall stays above 0.95.",
    "date": "2026-04-19",
    "id": 1776591567,
    "type": "error"
});