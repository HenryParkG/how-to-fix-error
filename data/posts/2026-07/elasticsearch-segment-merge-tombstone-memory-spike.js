window.onPostDataLoaded({
    "title": "Fix Elasticsearch Segment Merge Tombstone Memory Spikes",
    "slug": "elasticsearch-segment-merge-tombstone-memory-spike",
    "language": "Java / Lucene",
    "code": "MemorySpike",
    "tags": [
        "Elasticsearch",
        "Lucene",
        "JVM",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>High update or deletion workloads in Elasticsearch produce a high ratio of deleted documents (tombstones). During background Lucene segment merges, Lucene must reconcile document bitsets and ID maps across multiple segments. When thousands of small segments contain high tombstone counts, concurrent merges consume massive heap and off-heap memory allocations, triggering high GC pauses or node OutOfMemoryError (OOM) crashes.</p>",
    "root_cause": "Unthrottled concurrent merges on indices with high tombstone ratios force Lucene to load oversized deletion bitsets and doc-ID translation tables into memory simultaneously across threads.",
    "bad_code": "PUT /_cluster/settings\n{\n  \"persistent\": {\n    \"index.merge.scheduler.max_thread_count\": \"4\",\n    \"index.merge.policy.max_merge_at_once\": \"10\",\n    \"index.merge.policy.segments_per_tier\": \"10\"\n  }\n}",
    "solution_desc": "Restrict concurrent thread execution in the merge scheduler, raise the delete reclamation weight so small merges clean tombstones eagerly, and schedule explicit tombstone expunge calls off-peak.",
    "good_code": "PUT /my-index/_settings\n{\n  \"index.merge.scheduler.max_thread_count\": \"1\",\n  \"index.merge.policy.reclaim_deletes_weight\": \"3.0\",\n  \"index.merge.policy.max_merge_at_once\": \"5\",\n  \"index.merge.policy.segments_per_tier\": \"5\"\n}\n\n// Run off-peak expunge:\n// POST /my-index/_forcemerge?only_expunge_deletes=true",
    "verification": "Monitor node JVM heap and merge metrics via `GET /_nodes/stats/jvm,indices/merges` during heavy delete operations to ensure flat memory usage.",
    "date": "2026-07-23",
    "id": 1784794359,
    "type": "error"
});