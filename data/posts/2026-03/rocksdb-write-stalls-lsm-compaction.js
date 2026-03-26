window.onPostDataLoaded({
    "title": "Resolving RocksDB Write Stalls during LSM-Tree Compaction",
    "slug": "rocksdb-write-stalls-lsm-compaction",
    "language": "C++/Rust",
    "code": "WriteStallException",
    "tags": [
        "SQL",
        "Infra",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>RocksDB write stalls occur when the Log-Structured Merge-Tree (LSM-Tree) cannot keep up with the ingress rate. This usually triggers when the number of Level 0 (L0) files reaches a threshold, or when the pending compaction bytes exceed a limit.</p><p>When this happens, RocksDB intentionally slows down or stops incoming writes to prevent the system from falling over. This is often observed as sudden spikes in P99 latency while disk I/O for compaction threads is at 100% utilization.</p>",
    "root_cause": "The write rate exceeds the background compaction throughput, specifically hitting the 'level0_slowdown_writes_trigger' or 'soft_pending_compaction_bytes_limit' due to insufficient background threads or slow underlying storage.",
    "bad_code": "options.set_level0_file_num_compaction_trigger(4);\noptions.set_max_background_compactions(1);\n// High write pressure with only 1 thread causes L0 bloat\ndb.put(large_payload);",
    "solution_desc": "Increase the number of background compaction threads, tune the L0 triggers to be more permissive, and use partitioned index filters to reduce the CPU overhead during compaction.",
    "good_code": "options.set_max_background_jobs(8); // Handles both flush and compaction\noptions.set_level0_slowdown_writes_trigger(20);\noptions.set_level0_stop_writes_trigger(36);\noptions.set_target_file_size_base(64 * 1024 * 1024);",
    "verification": "Monitor the `rocksdb.write.stall` statistic via internal metrics. A successful fix will show zero or significantly reduced stall duration even under peak write loads.",
    "date": "2026-03-26",
    "id": 1774518867,
    "type": "error"
});