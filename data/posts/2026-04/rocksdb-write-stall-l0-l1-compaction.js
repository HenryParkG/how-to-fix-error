window.onPostDataLoaded({
    "title": "Mitigating RocksDB Write Stalls in L0-to-L1 Pressure",
    "slug": "rocksdb-write-stall-l0-l1-compaction",
    "language": "SQL",
    "code": "WriteStall",
    "tags": [
        "SQL",
        "Infra",
        "C++",
        "Error Fix"
    ],
    "analysis": "<p>RocksDB write stalls occur when the ingestion rate exceeds the compaction rate, particularly between Level 0 and Level 1. Since L0 files are sorted by time and can have overlapping keys, L0-to-L1 compaction is often a bottleneck because it requires reading multiple files to maintain the sorted invariant of L1.</p><p>When the number of L0 files hits the `level0_slowdown_writes_trigger`, RocksDB artificially slows down incoming writes. If it hits `level0_stop_writes_trigger`, writes are completely blocked, causing massive latency spikes in the application layer.</p>",
    "root_cause": "The background compaction threads are insufficient to handle the volume of L0 files, often caused by suboptimal sub-compaction settings or inadequate thread pool sizing.",
    "bad_code": "options.level0_slowdown_writes_trigger = 20;\noptions.level0_stop_writes_trigger = 36;\noptions.max_background_compactions = 1; // Bottleneck",
    "solution_desc": "Increase the number of background compaction threads and enable sub-compactions for L0-to-L1. This allows RocksDB to parallelize the compaction of a single large L0 file across multiple threads.",
    "good_code": "options.max_background_jobs = 8;\noptions.level0_file_num_compaction_trigger = 4;\noptions.max_subcompactions = 4; // Parallelize L0-to-L1\noptions.level0_slowdown_writes_trigger = 30;\noptions.level0_stop_writes_trigger = 50;",
    "verification": "Monitor LOG files for 'Stalling writes' messages and use 'rocksdb.stall.micros' statistics to ensure stall duration decreases under heavy load.",
    "date": "2026-04-10",
    "id": 1775798324,
    "type": "error"
});