window.onPostDataLoaded({
    "title": "Resolving RocksDB Write Amplification Spikes",
    "slug": "rocksdb-write-amplification-lsm-compaction",
    "language": "Rust",
    "code": "HighWriteAmp",
    "tags": [
        "Rust",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Write amplification (WA) is a critical bottleneck in LSM-tree based engines like RocksDB. In heavy write scenarios, the background compaction process struggles to merge SST files from Level 0 to Level 1. This leads to a 'compaction debt' where the same data is rewritten multiple times across levels, consuming disk I/O and shortening SSD lifespan. Default Leveled Compaction is often too aggressive for high-throughput append-only workloads.</p>",
    "root_cause": "The ratio between 'max_bytes_for_level_base' and L0 size is too small, causing frequent, overlapping compactions that move very little data while rewriting large portions of the level.",
    "bad_code": "let mut opts = Options::default();\nopts.set_level_compaction_dynamic_level_bytes(false);\nopts.set_max_bytes_for_level_base(64 * 1024 * 1024);\nopts.set_target_file_size_base(2 * 1024 * 1024);",
    "solution_desc": "Enable 'level_compaction_dynamic_level_bytes' to allow RocksDB to automatically adjust level sizes based on the actual size of the last level. Increase the L0-L1 trigger threshold and use 'Universal Compaction' for workloads that can tolerate slightly higher read amplification in exchange for much lower write amplification.",
    "good_code": "let mut opts = Options::default();\nopts.set_level_compaction_dynamic_level_bytes(true);\nopts.set_max_bytes_for_level_base(256 * 1024 * 1024);\nopts.set_target_file_size_base(64 * 1024 * 1024);\nopts.set_compression_type(DBCompressionType::Lz4);",
    "verification": "Check 'rocksdb.stats' for the 'Sum' row in the compaction stats table. Ensure the 'Write Amp' value is consistently below 10-15 for Leveled Compaction.",
    "date": "2026-05-07",
    "id": 1778141812,
    "type": "error"
});