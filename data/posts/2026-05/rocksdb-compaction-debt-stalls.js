window.onPostDataLoaded({
    "title": "Resolving LSM-Tree Compaction Debt in RocksDB",
    "slug": "rocksdb-compaction-debt-stalls",
    "language": "Go",
    "code": "WRITE_STALL",
    "tags": [
        "Go",
        "SQL",
        "Infrastructure",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>RocksDB-backed stores can experience sudden write stalls when the 'compaction debt' becomes too high. This happens when the rate of incoming writes exceeds the background threads' ability to merge L0 files into L1. As L0 files accumulate, RocksDB intentionally throttles or stops writes to prevent an unmanageable read-amplification spike.</p>",
    "root_cause": "Suboptimal background thread allocation and conservative L0 stall triggers that do not account for high-throughput NVMe write capabilities.",
    "bad_code": "opts := gorocksdb.NewDefaultOptions()\nopts.SetMaxBackgroundCompactions(1)\n// Default L0_slowdown_writes_trigger is often too low for modern SSDs",
    "solution_desc": "Increase the number of background compaction threads and enable subcompactions. Adjust the 'level0_slowdown_writes_trigger' and 'level0_stop_writes_trigger' to provide more headroom for bursty write traffic.",
    "good_code": "opts := gorocksdb.NewDefaultOptions()\nopts.SetMaxBackgroundCompactions(4)\nopts.SetMaxBackgroundFlushes(2)\nopts.SetLevel0SlowdownWritesTrigger(20)\nopts.SetLevel0StopWritesTrigger(40)\nopts.EnableStatistics()",
    "verification": "Check 'rocksdb.stall.micros' statistics to ensure write stall duration decreases under high load.",
    "date": "2026-05-11",
    "id": 1778480956,
    "type": "error"
});