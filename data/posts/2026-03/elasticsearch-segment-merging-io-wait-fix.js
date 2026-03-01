window.onPostDataLoaded({
    "title": "Fixing Elasticsearch Segment Merging and I/O Wait Spikes",
    "slug": "elasticsearch-segment-merging-io-wait-fix",
    "language": "Java",
    "code": "IOPerformance",
    "tags": [
        "Elasticsearch",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Elasticsearch stores data in Lucene segments. As new documents are indexed, small segments are created and eventually merged into larger ones to maintain search performance. However, on systems with high ingestion rates, the background merging process can saturate disk I/O, leading to 'I/O Wait' spikes that stall both indexing and search requests.</p><p>When the merge scheduler uses too many threads or when the I/O throttling is too aggressive for the underlying hardware (especially on SSDs vs HDDs), the entire node becomes unresponsive during large merge operations.</p>",
    "root_cause": "Default merge scheduler settings (max_thread_count) are often too high for non-SSD storage or shared-tenant environments, causing disk queue depth saturation.",
    "bad_code": "PUT /my_index/_settings\n{\n  \"index.merge.scheduler.max_thread_count\": 4, \n  \"index.refresh_interval\": \"1s\"\n}",
    "solution_desc": "Lower the 'max_thread_count' to 1 for magnetic drives or environments with limited IOPS. Increase the 'refresh_interval' to create fewer, larger initial segments, reducing the total merge pressure. Enable 'adaptive' merge throttling to allow Elasticsearch to dynamically adjust based on storage performance.",
    "good_code": "PUT /my_index/_settings\n{\n  \"index.merge.scheduler.max_thread_count\": 1,\n  \"index.refresh_interval\": \"30s\",\n  \"index.merge.policy.max_merged_segment\": \"5gb\"\n}",
    "verification": "Monitor the 'index_stats.merges.total_throttled_time_in_millis' metric and check CPU iowait percentage using 'iostat' during peak ingestion.",
    "date": "2026-03-01",
    "id": 1772340540,
    "type": "error"
});