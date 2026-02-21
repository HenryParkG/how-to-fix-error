window.onPostDataLoaded({
    "title": "Fix RocksDB Write Stalls Under Compaction Debt",
    "slug": "rocksdb-compaction-write-stalls",
    "language": "Go",
    "code": "PerformanceStall",
    "tags": [
        "Go",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>RocksDB write stalls occur when the incoming write rate exceeds the background compaction speed. In high-throughput environments, the Level 0 (L0) files accumulate faster than the background threads can merge them into Level 1.</p><p>When the number of L0 files reaches a hard limit, RocksDB intentionally throttles or stops all writes to prevent an unmanageable read amplification, causing latency spikes in the application layer.</p>",
    "root_cause": "Insufficient background compaction threads and conservative 'soft_pending_compaction_bytes_limit' settings that trigger write-slowing mechanisms too early.",
    "bad_code": "// Default options lead to stalls under heavy load\nopts := gorocksdb.NewDefaultOptions()\nopts.SetWriteBufferSize(64 * 1024 * 1024)\nopts.SetMaxWriteBufferNumber(2)",
    "solution_desc": "Increase background threads, tune L0 triggers, and set a higher pending compaction bytes limit to allow the engine to absorb temporary write bursts.",
    "good_code": "opts := gorocksdb.NewDefaultOptions()\nopts.SetMaxBackgroundCompactions(4)\nopts.SetLevel0SlowdownWritesTrigger(20)\nopts.SetLevel0StopWritesTrigger(36)\nopts.SetSoftPendingCompactionBytesLimit(64 * 1024 * 1024 * 1024) // 64GB",
    "verification": "Check RocksDB statistics for 'stall_micros' and monitor the number of L0 files using the 'rocksdb.num-files-at-level0' property.",
    "date": "2026-02-21",
    "id": 1771665724,
    "type": "error"
});