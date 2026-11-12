window.onPostDataLoaded({
    "title": "Fixing RocksDB Write Stalls & Compaction Debt",
    "slug": "rocksdb-write-stalls-compaction-debt",
    "language": "C++ / Rust",
    "code": "WriteStall",
    "tags": [
        "RocksDB",
        "Storage",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput write workloads, RocksDB can suddenly degrade in throughput, exhibiting periodic latency spikes that escalate from hundreds of microseconds to multiple seconds. This degradation occurs because RocksDB applies deliberate write stalls to safeguard internal storage invariants when background compaction or memtable flushing cannot keep pace with ingress.</p><p>When incoming write rates outstrip hardware I/O bandwidth or background thread concurrency, active memtables saturate before they can be flushed to disk as Level 0 (L0) SST files. Simultaneously, L0 files accumulate because compaction workers cannot merge them into Level 1 (L1) fast enough. As L0 file count reaches safety thresholds, RocksDB progressively throttles or freezes write calls until compactions catch up, creating massive latency spikes.</p>",
    "root_cause": "Write stalls are triggered when immutable memtables exceed 'max_write_buffer_number', or when L0 file counts hit 'level0_slowdown_writes_trigger' and 'level0_stop_writes_trigger'. Insufficient background threads ('max_background_flushes' and 'max_background_compactions') and default single-thread flush queues prevent timely debt resolution.",
    "bad_code": "// Naive RocksDB configuration with default compaction & thread limits\nrocksdb::Options options;\noptions.create_if_missing = true;\noptions.write_buffer_size = 64 * 1024 * 1024; // 64MB\noptions.max_write_buffer_number = 2;          // Only 2 memtables allowed\noptions.level0_file_num_compaction_trigger = 4;\n// Default slowdown and stop triggers will stall writes under bursts:\n// level0_slowdown_writes_trigger = 20\n// level0_stop_writes_trigger = 36\n// Single background thread handles both flushes and compactions\noptions.max_background_jobs = 2;\n\nrocksdb::DB* db;\nrocksdb::Status status = rocksdb::DB::Open(options, \"/tmp/testdb\", &db);",
    "solution_desc": "Mitigate write stalls by sizing memtable buffers for burst absorption, decoupling flush and compaction thread pools, increasing L0 write slowdown thresholds, and enabling dynamic level base sizing to scale compaction workload proportionally.",
    "good_code": "rocksdb::Options options;\noptions.create_if_missing = true;\n\n// Allocate buffer headroom for ingestion bursts\noptions.write_buffer_size = 128 * 1024 * 1024; // 128MB\noptions.max_write_buffer_number = 6;\noptions.min_write_buffer_number_to_merge = 2;\n\n// Increase L0 headroom before throttling kicks in\noptions.level0_file_num_compaction_trigger = 4;\noptions.level0_slowdown_writes_trigger = 40;\noptions.level0_stop_writes_trigger = 64;\n\n// Decouple flush and compaction parallelism\noptions.max_background_flushes = 4;\noptions.max_background_compactions = 8;\noptions.max_background_jobs = 12;\n\n// Dynamically adapt target level sizes to minimize compaction debt\noptions.max_bytes_for_level_base = 512 * 1024 * 1024;\noptions.level_compaction_dynamic_level_bytes = true;\n\nrocksdb::DB* db;\nrocksdb::Status status = rocksdb::DB::Open(options, \"/tmp/testdb\", &db);",
    "verification": "Monitor RocksDB metrics via statistics tickers: 'rocksdb.stall.micros' should drop near zero, and 'rocksdb.num.stall.keys' must remain stable under sustained write benchmarks run via 'db_bench --benchmarks=fillrandom --threads=16'.",
    "date": "2026-11-12",
    "id": 1794493754,
    "type": "error"
});