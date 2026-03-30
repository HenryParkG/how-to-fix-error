window.onPostDataLoaded({
    "title": "Fixing Cassandra SSTable Bloat from Tombstone Accumulation",
    "slug": "cassandra-sstable-tombstone-bloat",
    "language": "Cassandra",
    "code": "TombstoneOverload",
    "tags": [
        "SQL",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Cassandra, deletes are writes. A delete creates a 'tombstone'\u2014a marker that hides the old data. These tombstones remain until a compaction process merges SSTables and the 'gc_grace_seconds' period expires. In deletion-heavy workloads, tombstones can accumulate faster than they are purged, leading to massive SSTable bloat, increased disk usage, and 'TombstoneOverwhelmingException' during read scans.</p>",
    "root_cause": "Tombstones cannot be evicted if they span multiple SSTables that aren't being compacted together, or if gc_grace_seconds is set too high for the deletion frequency.",
    "bad_code": "ALTER TABLE orders WITH gc_grace_seconds = 864000; -- 10 days default\n-- Application logic performing millions of small deletes daily",
    "solution_desc": "Tune the 'gc_grace_seconds' based on your repair cycle and switch to 'LeveledCompactionStrategy' (LCS) for more aggressive SSTable merging. Alternatively, use TTLs if data expiry is predictable.",
    "good_code": "ALTER TABLE orders WITH gc_grace_seconds = 86400 \n  AND compaction = {'class': 'LeveledCompactionStrategy'};\n-- Also, ensure incremental repairs are running regularly.",
    "verification": "Use 'nodetool tablestats' to check 'Average tombstones per slice' and monitor SSTable count on disk.",
    "date": "2026-03-30",
    "id": 1774855039,
    "type": "error"
});