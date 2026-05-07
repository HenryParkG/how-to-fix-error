window.onPostDataLoaded({
    "title": "Fixing ClickHouse Tail Latency During Part Merges",
    "slug": "clickhouse-latency-spikes-merges",
    "language": "SQL",
    "code": "Database/Config",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>ClickHouse uses a MergeTree engine that periodically merges data 'parts' in the background to optimize read performance and apply TTLs. However, during heavy write loads, these background merges can saturate I/O and CPU, causing significant tail latency (P99 spikes) for concurrent SELECT queries. This 'merge storm' often happens when the background pool is too aggressive or when the disk subsystem cannot handle the combined IOPS of ingestion and merging.</p>",
    "root_cause": "The default background_pool_size and max_bytes_to_merge_at_max_speed are often too high for cloud storage (EBS), leading to I/O throttling during merge cycles.",
    "bad_code": "<storage_configuration>\n    <!-- Default aggressive settings -->\n    <background_pool_size>16</background_pool_size>\n</storage_configuration>",
    "solution_desc": "Throttle the merge process by limiting the number of concurrent merges and the total throughput they can consume. Adjusting the 'vertical' merge settings can also help by merging columns independently, reducing the total I/O pressure per merge task.",
    "good_code": "ALTER SYSTEM MODIFY SETTING \nmax_bytes_to_merge_at_max_speed_per_second = 104857600, -- 100MB/s\nbackground_pool_size = 8,\nmax_replicated_merges_with_low_priority = 2;",
    "verification": "Check the system.part_log and system.metrics tables to ensure the 'Merge' metric is stable and that P99 query latency correlates less with background merge execution times.",
    "date": "2026-05-07",
    "id": 1778133179,
    "type": "error"
});