window.onPostDataLoaded({
    "title": "Fix Cassandra Tombstone Read Timeout Cascades",
    "slug": "cassandra-tombstone-read-timeout-cascades",
    "language": "Cassandra",
    "code": "ReadTimeoutException",
    "tags": [
        "Cassandra",
        "Java",
        "SQL",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>Apache Cassandra uses an append-only Log-Structured Merge (LSM) storage engine. Deletions and null cell updates do not immediately remove data from disk; instead, they append a deletion marker known as a <strong>tombstone</strong> with a local deletion timestamp.</p><p>When a coordinator node executes a read query, the storage engine scans SSTables across disk and memtables. If a partition contains thousands of tombstones, the node must scan past them to satisfy the limit. Exceeding <code>tombstone_failure_threshold</code> (default 100,000) causes an immediate <code>TombstoneOverwhelmedException</code>. Even before hitting this limit, scanning uncompacted tombstones triggers massive JVM garbage collection pauses, coordinator timeouts (<code>ReadTimeoutException</code>), and cascading node failures across the ring.</p>",
    "root_cause": "Frequent row deletions or inserting columns with null values combined with long `gc_grace_seconds` creates dense clusters of tombstones that read queries must scan through before locating live records.",
    "bad_code": "CREATE TABLE order_tracking (\n    tenant_id uuid,\n    status text,\n    order_id uuid,\n    updated_at timestamp,\n    payload text,\n    PRIMARY KEY ((tenant_id), status, order_id)\n);\n\n-- Anti-pattern: High-churn queue-like deletion\n-- When tasks complete, rows are deleted:\nDELETE FROM order_tracking \nWHERE tenant_id = 7f8a9e20-1b2c-3d4e-5f6a-7b8c9d0e1f2a \n  AND status = 'PENDING' \n  AND order_id = e4b0f92b-3e5f-4a6c-9a3b-287dfb01e354;\n\n-- Reader query scans thousands of tombstones before finding active items:\nSELECT * FROM order_tracking \nWHERE tenant_id = 7f8a9e20-1b2c-3d4e-5f6a-7b8c9d0e1f2a \n  AND status = 'PENDING' \nLIMIT 50;",
    "solution_desc": "Avoid using Cassandra as a work queue. Model high-churn data by bucketing partitions by time (e.g., date or hour) using TimeWindowCompactionStrategy (TWCS) so entire obsolete SSTables are dropped cleanly without individual tombstone traversals. Lower `gc_grace_seconds` appropriately if data is replicated across multiple nodes and repair runs frequently.",
    "good_code": "CREATE TABLE order_tracking_bucketed (\n    tenant_id uuid,\n    bucket_date date,\n    status text,\n    order_id uuid,\n    payload text,\n    PRIMARY KEY ((tenant_id, bucket_date), status, order_id)\n) WITH compaction = {\n    'class': 'TimeWindowCompactionStrategy',\n    'compaction_window_unit': 'DAYS',\n    'compaction_window_size': '1',\n    'timestamp_resolution': 'MILLISECONDS'\n} AND gc_grace_seconds = 86400;\n\n-- Reads are scoped to current operational bucket, bypassing historic tombstones:\nSELECT * FROM order_tracking_bucketed \nWHERE tenant_id = 7f8a9e20-1b2c-3d4e-5f6a-7b8c9d0e1f2a \n  AND bucket_date = '2026-03-31' \n  AND status = 'PENDING' \nLIMIT 50;",
    "verification": "Inspect tombstone activity via `nodetool tablestats <keyspace>.order_tracking_bucketed` and ensure the maximum tombstone cell count remains well below `tombstone_warn_threshold` (1,000).",
    "date": "2026-11-09",
    "id": 1794236118,
    "type": "error"
});