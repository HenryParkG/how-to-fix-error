window.onPostDataLoaded({
    "title": "Resolving Cassandra Tombstone Bloat in Wide-Row Schemas",
    "slug": "cassandra-tombstone-bloat-wide-rows",
    "language": "SQL",
    "code": "TombstoneOverload",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Cassandra handles deletions by writing 'tombstones' rather than immediately removing data. In high-churn wide-row schemas (e.g., job queues or time-series buffers), these tombstones accumulate in SSTables.</p><p>When a read occurs, Cassandra must scan these tombstones to ensure it returns the correct state. If the number of tombstones exceeds a threshold (default 100,000), the query fails with a TombstoneOverwhelmingException, causing severe latency spikes.</p>",
    "root_cause": "High volume of individual cell deletes combined with long 'gc_grace_seconds' and SizeTieredCompactionStrategy.",
    "bad_code": "CREATE TABLE events (\n    user_id uuid,\n    event_id uuid,\n    data text,\n    PRIMARY KEY (user_id, event_id)\n) WITH gc_grace_seconds = 864000; // 10 days default",
    "solution_desc": "Switch to LeveledCompactionStrategy (LCS) for more aggressive tombstone eviction, reduce 'gc_grace_seconds' if data consistency allows, and optimize the application to use TTLs or range deletes instead of single-row deletes.",
    "good_code": "ALTER TABLE events WITH gc_grace_seconds = 86400 \n  AND compaction = {\n    'class': 'LeveledCompactionStrategy',\n    'sstable_size_in_mb': 160\n  };",
    "verification": "Run 'nodetool cfstats' and check the 'Average tombstones per slice' metric to ensure it stays below the warning threshold.",
    "date": "2026-04-08",
    "id": 1775632110,
    "type": "error"
});