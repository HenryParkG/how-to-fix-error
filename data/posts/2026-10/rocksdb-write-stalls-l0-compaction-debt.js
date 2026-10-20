window.onPostDataLoaded({
    "title": "Mitigating RocksDB Write Stalls from L0 File Accumulation",
    "slug": "rocksdb-write-stalls-l0-compaction-debt",
    "language": "SQL",
    "code": "Status::Incomplete",
    "tags": [
        "SQL",
        "Rust",
        "Backend",
        "Storage",
        "Error Fix"
    ],
    "analysis": "<p>In Log-Structured Merge-tree (LSM) storage engines like RocksDB, incoming writes are first written to an append-only Write-Ahead Log (WAL) and buffered in volatile MemTables. When a MemTable fills up, it becomes immutable and flushes sequentially to Level 0 (L0) SST files on disk.</p><p>Unlike Levels 1 through N, L0 SST files share overlapping key ranges. Read operations must consult all L0 files unless bloom filters eliminate them. To prevent read amplification from spiraling out of control, RocksDB automatically triggers write stalls (slowing down ingestion to a crawl or stopping it entirely) when L0 file counts cross configured thresholds or when compaction debt accumulates faster than storage I/O bandwidth can process.</p>",
    "root_cause": "Ingestion rate substantially exceeds background L0-to-L1 compaction throughput. When the number of unsorted L0 files surpasses `level0_slowdown_writes_trigger` or `level0_stop_writes_trigger`, RocksDB intentionally throttles or pauses `db->Write()` calls to prevent read latency collapse.",
    "bad_code": "rocksdb::Options options;\noptions.create_if_missing = true;\n// BUG: Default compaction settings under heavy write-load\noptions.write_buffer_size = 64 * 1024 * 1024; // 64MB MemTable\noptions.max_background_jobs = 2;              // Insufficient threads for flush + compaction\noptions.level0_file_num_compaction_trigger = 4;\noptions.level0_slowdown_writes_trigger = 8;   // Aggressively stalls at only 8 files\noptions.level0_stop_writes_trigger = 12;      // Halts ingestion completely at 12 files\n\nrocksdb::DB* db;\nrocksdb::DB::Open(options, \"/var/data/db\", &db);",
    "solution_desc": "Allocate sufficient background worker threads for both flush and compaction pools (`max_background_jobs`), configure subcompactions (`max_subcompactions`) for parallelized single-level merges, adjust L0 trigger ratios, and implement a `WriteBufferManager` combined with a token-bucket `RateLimiter` to smooth burst traffic into a sustainable write stream.",
    "good_code": "#include <rocksdb/db.h>\n#include <rocksdb/options.h>\n#include <rocksdb/rate_limiter.h>\n\nrocksdb::Options options;\noptions.create_if_missing = true;\n\n// Scale thread pool to handle concurrent L0-L1 and higher level compactions\noptions.max_background_jobs = 8;\noptions.max_subcompactions = 4;\n\n// MemTable and L0 geometry tuning\noptions.write_buffer_size = 128 * 1024 * 1024; // 128MB\noptions.max_write_buffer_number = 6;\noptions.min_write_buffer_number_to_merge = 2;\n\n// Relax L0 triggers to tolerate burst ingestion without instantaneous stalls\noptions.level0_file_num_compaction_trigger = 4;\noptions.level0_slowdown_writes_trigger = 20;\noptions.level0_stop_writes_trigger = 36;\n\n// Smooth write spikes with RocksDB rate limiter (e.g., 100 MB/s limit)\noptions.rate_limiter = std::shared_ptr<rocksdb::RateLimiter>(\n    rocksdb::NewGenericRateLimiter(100 * 1024 * 1024, 100 * 1000, 10)\n);\n\nrocksdb::DB* db;\nrocksdb::DB::Open(options, \"/var/data/db\", &db);",
    "verification": "Inspect RocksDB internal metrics by querying `db->GetProperty(\"rocksdb.actual-delayed-write-rate\", &val)` and monitor `rocksdb.db.write-delay-micros`. Ensure stall durations drop to near zero and `rocksdb.compaction.pending.bytes` remains stable during sustained load tests.",
    "date": "2026-10-20",
    "id": 1792505206,
    "type": "error"
});