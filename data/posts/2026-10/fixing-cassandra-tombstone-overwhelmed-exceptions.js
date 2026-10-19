window.onPostDataLoaded({
    "title": "Fixing Cassandra Tombstone Overwhelmed Exceptions",
    "slug": "fixing-cassandra-tombstone-overwhelmed-exceptions",
    "language": "Java",
    "code": "TombstoneOverwhelmedException",
    "tags": [
        "Cassandra",
        "SQL",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>In Apache Cassandra, executing deletes, setting TTLs, or writing null values to columns generates markers known as tombstones. When queries read from partitions containing heavy write/delete churn, the node scans both live cells and tombstones before filtering data in memory.</p><p>If the number of traversed tombstones exceeds <code>tombstone_failure_threshold</code> (default 100,000 cells), Cassandra immediately aborts the query and throws <code>TombstoneOverwhelmedException</code> to protect the JVM from an out-of-memory crash. This commonly cripples wide-row partitions like event streams or high-turnover task queues.</p>",
    "root_cause": "High-frequency deletes and TTL expirations inside wide partitions combined with long default `gc_grace_seconds` (864000) and SizeTieredCompactionStrategy, which delays tombstone compaction and triggers partition scans that exceed failure thresholds.",
    "bad_code": "// Buggy table schema and query design generating excessive tombstones\n// CQL Schema:\n// CREATE TABLE sensor_stream (\n//     sensor_id text,\n//     event_id timeuuid,\n//     payload text,\n//     PRIMARY KEY (sensor_id, event_id)\n// ) WITH gc_grace_seconds = 864000;\n\npublic ResultSet readLatestEvents(Session session, String sensorId) {\n    // Scans unbounded clustering keys including thousands of expired TTL tombstones\n    SimpleStatement stmt = new SimpleStatement(\n        \"SELECT * FROM sensor_stream WHERE sensor_id = ? LIMIT 50\",\n        sensorId\n    );\n    return session.execute(stmt); // Throws TombstoneOverwhelmedException\n}",
    "solution_desc": "Partition large time-series by bucket windows (e.g., daily/hourly) to restrict scan volume. Adopt TimeWindowCompactionStrategy (TWCS) for time-series data with TTLs, reduce `gc_grace_seconds` where appropriate, and query bounded clustering key intervals instead of scanning wide partitions.",
    "good_code": "// Fixed schema utilizing TimeWindowCompactionStrategy and bounded partition bucketing\n// CQL Schema:\n// CREATE TABLE sensor_stream_bucketed (\n//     sensor_id text,\n//     bucket text, // e.g., '2026-03-29-10'\n//     event_id timeuuid,\n//     payload text,\n//     PRIMARY KEY ((sensor_id, bucket), event_id)\n// ) WITH compaction = {\n//     'class': 'TimeWindowCompactionStrategy',\n//     'compaction_window_size': '1',\n//     'compaction_window_unit': 'HOURS'\n// } AND gc_grace_seconds = 3600;\n\npublic ResultSet readBucketedEvents(Session session, String sensorId, String currentBucket, UUID minEventId) {\n    BoundStatement bound = session.prepare(\n        \"SELECT * FROM sensor_stream_bucketed WHERE sensor_id = ? AND bucket = ? AND event_id > ? LIMIT 50\"\n    ).bind(sensorId, currentBucket, minEventId);\n    return session.execute(bound);\n}",
    "verification": "Run `nodetool tablestats <keyspace>.<table_name>` and inspect the 'Average tombstones per slice' metric. Confirm that queries consistently scan fewer than 100 tombstones per request and error logs show zero `TombstoneOverwhelmedException` events.",
    "date": "2026-10-19",
    "id": 1792397895,
    "type": "error"
});