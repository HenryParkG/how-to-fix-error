window.onPostDataLoaded({
    "title": "Fixing Qdrant Memory Saturation during HNSW Rebuilds",
    "slug": "fixing-qdrant-memory-saturation-hnsw-rebuilds",
    "language": "Rust",
    "code": "OOM-Killed-HNSW",
    "tags": [
        "Rust",
        "Docker",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>When operating high-dimensional vector search engines using Qdrant (such as vectors of 1536 dimensions used by modern LLM embeddings), memory exhaustion can occur during index rebuild periods. The HNSW (Hierarchical Navigable Small World) index building phase is heavily reliant on heap operations to construct spatial multi-layer graph networks.</p><p>By default, Qdrant constructs the indexes with high default indexing parameters and parallel threads. When updating high volumes of vectors concurrently, multiple index building tasks fire off in parallel, inflating RAM usage and exhausting memory space, triggering Linux kernel out-of-memory (OOM) processes to forcefully terminate the DB container.</p>",
    "root_cause": "High concurrent allocation of vector nodes during graph indexing combined with loose configuration parameters (high 'm' and 'ef_construct') causes the engine to exceed host RAM capacities during concurrent vector optimization runs.",
    "bad_code": "{\n  \"vectors\": {\n    \"size\": 1536,\n    \"distance\": \"Cosine\",\n    \"hnsw_config\": {\n      \"m\": 64,\n      \"ef_construct\": 512,\n      \"max_indexing_threads\": 0\n    }\n  }\n}",
    "solution_desc": "Configure HNSW variables systematically by scaling down graph parameters like 'm' and 'ef_construct' to safe levels. Additionally, strictly limit the 'max_indexing_threads' to limit thread pool allocation, and utilize Scalar Quantization (SQ) to serialize representations into smaller 8-bit memory profiles.",
    "good_code": "{\n  \"vectors\": {\n    \"size\": 1536,\n    \"distance\": \"Cosine\",\n    \"hnsw_config\": {\n      \"m\": 16,\n      \"ef_construct\": 100,\n      \"max_indexing_threads\": 2\n    },\n    \"quantization_config\": {\n      \"scalar\": {\n        \"type\": \"int8\",\n        \"always_ram\": true\n      }\n    }\n  }\n}",
    "verification": "Trigger index reconstruction via the Qdrant REST API (`PUT /collections/{collection_name}/index`) while tracking process memory footprints with Docker Stats or Prometheus telemetry panels.",
    "date": "2026-05-24",
    "id": 1779618414,
    "type": "error"
});