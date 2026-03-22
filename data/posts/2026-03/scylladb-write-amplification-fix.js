window.onPostDataLoaded({
    "title": "Mitigating ScyllaDB Write Amplification",
    "slug": "scylladb-write-amplification-fix",
    "language": "SQL",
    "code": "WRITE_AMP",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Write amplification in ScyllaDB occurs when the background compaction process rewrites data more frequently than necessary. In write-heavy workloads using the default Size-Tiered Compaction Strategy (STCS), this results in high disk I/O utilization and increased read latency due to fragmented SSTables.</p>",
    "root_cause": "STCS merging logic is inefficient for workloads with high overwrite rates or time-series data characteristics.",
    "bad_code": "CREATE TABLE logs (\n    id UUID PRIMARY KEY,\n    data text\n) WITH compaction = {'class': 'SizeTieredCompactionStrategy'};",
    "solution_desc": "Switch the compaction strategy to LeveledCompactionStrategy (LCS) for update-heavy workloads or TimeWindowCompactionStrategy (TWCS) for time-series data to optimize how SSTables are merged.",
    "good_code": "CREATE TABLE logs (\n    id UUID PRIMARY KEY,\n    data text\n) WITH compaction = {\n    'class': 'LeveledCompactionStrategy',\n    'sstable_size_in_mb': 160\n};",
    "verification": "Monitor the 'Compaction Write VBytes' metric in ScyllaDB Monitoring Stack to ensure the ratio of user writes to disk writes is minimized.",
    "date": "2026-03-22",
    "id": 1774161587,
    "type": "error"
});