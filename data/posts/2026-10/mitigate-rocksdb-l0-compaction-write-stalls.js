window.onPostDataLoaded({
    "title": "Mitigate RocksDB L0 Compaction Write Stalls",
    "slug": "mitigate-rocksdb-l0-compaction-write-stalls",
    "language": "RocksDB / C++",
    "code": "Status::Busy (Write Stall)",
    "tags": [
        "SQL",
        "Database",
        "Performance",
        "Storage",
        "Error Fix"
    ],
    "analysis": "<p>In RocksDB, mutations are appended to an in-memory <code>MemTable</code> and an on-disk Write-Ahead Log (WAL). When a MemTable reaches capacity, it becomes immutable and is flushed to disk as an SSTable file in Level-0 (L0). Unlike levels L1 through Ln, L0 SST files contain overlapping key ranges, which necessitates searching every L0 file during point lookups and range scans.</p><p>To prevent read performance degradation, RocksDB implements backpressure via write stalls. When the count of L0 SSTables reaches <code>level0_slowdown_writes_trigger</code>, ingestion is throttled. If it reaches <code>level0_stop_writes_trigger</code>, writes stall entirely. Under sustained write-heavy workloads, background compaction threads cannot compress and migrate L0 files to L1 fast enough, leading to intermittent multi-second latency spikes and client request timeouts.</p>",
    "root_cause": "The rate of MemTable flushes to L0 exceeds the single- or low-concurrency compaction throughput from L0 to L1. This bottleneck is amplified when compaction bandwidth is choked by inadequate thread allocation, oversized L1 boundaries, or synchronous disk I/O.",
    "bad_code": "rocksdb::Options options;\noptions.create_if_missing = true;\n\n// Default or misconfigured stall settings\noptions.write_buffer_size = 64 * 1024 * 1024; // 64MB Memtable\noptions.max_write_buffer_number = 3;\n\n// Very aggressive stall points without scaling compaction workers\noptions.level0_file_num_compaction_trigger = 4;\noptions.level0_slowdown_writes_trigger = 8;\noptions.level0_stop_writes_trigger = 12;\n\n// Only 1 background thread handling both flushes and compactions\noptions.max_background_jobs = 2;\noptions.max_subcompactions = 1;\n\nrocksdb::DB* db;\nrocksdb::Status status = rocksdb::DB::Open(options, \"/data/rocksdb\", &db);",
    "solution_desc": "Decouple write ingestion and compaction backpressure by: 1) Increasing background job threads and configuring sub-compactions for parallel L0->L1 compactions; 2) Expanding the headroom between the compaction trigger and the stall/stop triggers; 3) Enabling dynamic base level bytes sizing (`level_compaction_dynamic_level_bytes = true`) to prevent massive file churn at L1.",
    "good_code": "rocksdb::Options options;\noptions.create_if_missing = true;\n\n// Optimize memory and buffer sizes\noptions.write_buffer_size = 128 * 1024 * 1024; // 128MB\noptions.max_write_buffer_number = 6;\noptions.min_write_buffer_number_to_merge = 2;\n\n// Widen the L0 trigger gap to absorb transient write spikes\noptions.level0_file_num_compaction_trigger = 4;\noptions.level0_slowdown_writes_trigger = 24;\noptions.level0_stop_writes_trigger = 36;\n\n// Allocate dedicated background threads and parallel subcompactions\noptions.max_background_jobs = 8;\noptions.max_subcompactions = 4;\n\n// Enable dynamic level calculation to stabilize L0 -> L1 compaction volume\noptions.level_compaction_dynamic_level_bytes = true;\noptions.max_bytes_for_level_base = 512 * 1024 * 1024; // 512MB\n\nrocksdb::DB* db;\nrocksdb::Status status = rocksdb::DB::Open(options, \"/data/rocksdb\", &db);",
    "verification": "Enable RocksDB statistics (`options.statistics = rocksdb::CreateDBStatistics()`). Monitor the metrics `STALL_MICROS`, `ROCKSDB_LEVEL0_SLOWDOWN_WRITES_STALL`, and `ROCKSDB_LEVEL0_NUM_FILES`. Verify in Grafana or stdout logs that L0 file count remains below the slowdown trigger during peak writes and `STALL_MICROS` drops to zero.",
    "date": "2026-10-25",
    "id": 1792915202,
    "type": "error"
});