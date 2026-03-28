window.onPostDataLoaded({
    "title": "Resolving Cassandra Mutation Dropping via I/O Throttling",
    "slug": "cassandra-mutation-dropping-io-saturation",
    "language": "Java",
    "code": "Mutation Error",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Cassandra nodes drop mutations when the mutation stage queue fills up, usually because the commit log or SSTables cannot be written to disk fast enough. During heavy SSTable compaction, I/O saturation occurs, creating backpressure that prevents the memtable from flushing, which eventually halts new writes (mutations).</p>",
    "root_cause": "The root cause is unconstrained compaction throughput consuming the disk's available IOPS, combined with a 'memtable_flush_writers' setting that is too low to handle the incoming write volume during background maintenance.",
    "bad_code": "# cassandra.yaml defaults\ncompaction_throughput_mb_per_sec: 16\n# During spikes, this is ignored or set too high for slow disks\nconcurrent_compactors: 8",
    "solution_desc": "Throttle compaction throughput to preserve I/O for mutations and increase the number of flush writers. Implementing 'LeveledCompactionStrategy' can also reduce the I/O overhead compared to 'SizeTieredCompactionStrategy' for write-heavy workloads.",
    "good_code": "# Optimized cassandra.yaml\ncompaction_throughput_mb_per_sec: 64\nmemtable_flush_writers: 4\nconcurrent_compactors: 2\n# Use nodetool to set at runtime\nnodetool setcompactionthroughput 32",
    "verification": "Check 'nodetool tpstats' to monitor the 'MutationStage' and 'Dropped Messages'. If 'Dropped' count remains zero during compaction, the I/O saturation is successfully mitigated.",
    "date": "2026-03-28",
    "id": 1774680463,
    "type": "error"
});