window.onPostDataLoaded({
    "title": "Mitigating Cassandra Tombstone Saturation",
    "slug": "cassandra-tombstone-saturation-fix",
    "language": "Java/CQL",
    "code": "TombstoneOverwhelmingException",
    "tags": [
        "SQL",
        "Infra",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>Cassandra handles deletes by writing 'tombstones' rather than immediately removing data. In write-heavy workloads with frequent deletes or low TTLs, these tombstones accumulate in SSTables. During reads, the coordinator must scan these tombstones to ensure deleted data isn't returned, causing massive latency spikes and <code>TombstoneOverwhelmingException</code> when the threshold (default 100,000) is hit.</p>",
    "root_cause": "High gc_grace_seconds preventing timely compaction of deleted markers in high-churn datasets.",
    "bad_code": "CREATE TABLE events (\n  id uuid PRIMARY KEY,\n  data text\n) WITH gc_grace_seconds = 864000; -- 10 days default",
    "solution_desc": "Lower gc_grace_seconds for tables with high delete rates and switch to LeveledCompactionStrategy (LCS) to trigger more aggressive compaction of small SSTables.",
    "good_code": "ALTER TABLE events WITH gc_grace_seconds = 3600\n  AND compaction = {'class': 'LeveledCompactionStrategy'}\n  AND tombstone_threshold = 0.1;",
    "verification": "Run 'nodetool tablestats' and monitor 'Number of tombstones scanned' via JMX.",
    "date": "2026-03-05",
    "id": 1772692870,
    "type": "error"
});