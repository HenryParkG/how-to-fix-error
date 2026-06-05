window.onPostDataLoaded({
    "title": "Fixing Postgres TXID Wraparound from Abandoned Slots",
    "slug": "fixing-postgres-txid-wraparound-abandoned-slots",
    "language": "SQL",
    "code": "TXID Wraparound",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on Multi-Version Concurrency Control (MVCC) to support high-concurrency transactions. This requires tracking the lifetime of tuples using transaction identifiers (TXIDs). Because these identifiers are represented as 32-bit integers, they are cyclic and subject to wraparound starvation after approximately 2 billion transactions. To mitigate this, PostgreSQL runs autovacuum workers to 'freeze' old transaction IDs. However, if a physical or logical replication slot is abandoned and remains inactive, PostgreSQL must keep all transaction history (WAL and heap tuples) active since the replication slot's <code>xmin</code> or <code>catalog_xmin</code> horizon was last acknowledged. This stalls the vacuum freeze process globally, causing <code>age(datfrozenxid)</code> to grow linearly until the database reaches the critical safety shutdown threshold (typically 200 million transactions before wraparound failure).</p>",
    "root_cause": "Abandoned or inactive replication slots prevent the global minimum transaction ID (xmin) from advancing. Because autovacuum cannot freeze tuples younger than the oldest active xmin across the entire cluster, it skips older tuples. As transactions continue to process, the gap between the current transaction ID and the oldest unfrozen transaction ID approaches 2 billion, triggering database safety locks.",
    "bad_code": "-- Creating a logical replication slot for a consumer that is subsequently abandoned\nSELECT pg_create_logical_replication_slot('abandoned_analytics_slot', 'pgoutput');\n\n-- Monitoring query shows the slot is inactive, but it remains in the system\n-- and pins the catalog_xmin horizon indefinitely:\nSELECT slot_name, active, xmin, catalog_xmin \nFROM pg_replication_slots \nWHERE active = false;",
    "solution_desc": "To resolve the wraparound hazard, identify inactive replication slots that are pinning the transaction horizons. Drop these inactive slots using `pg_drop_replication_slot()`. To prevent future starvation, configure the safety parameter `max_slot_wal_keep_size` so that inactive replication slots are automatically invalidated if they fall too far behind, ensuring they cannot exhaust disk space or block the transaction log freeze horizon.",
    "good_code": "-- Step 1: Query database to find inactive slots pinning the oldest transactions\nSELECT slot_name, plugin, slot_type, active,\n       age(xmin) AS xmin_age, \n       age(catalog_xmin) AS catalog_xmin_age\nFROM pg_replication_slots\nWHERE active = false AND (age(xmin) > 10000000 OR age(catalog_xmin) > 10000000);\n\n-- Step 2: Safe function to drop the offending inactive replication slot\nSELECT pg_drop_replication_slot('abandoned_analytics_slot');\n\n-- Step 3: Implement WAL safety limits in postgresql.conf to invalidate lagging slots\n-- ALTER SYSTEM SET max_slot_wal_keep_size = '51200MB';\n-- SELECT pg_reload_conf();",
    "verification": "Run `SELECT datname, age(datfrozenxid) FROM pg_database WHERE datallowconn = true;` before and after. After dropping the slot, run `VACUUM FREEZE ANALYZE;` on the affected tables. Verify that the age of `datfrozenxid` drops significantly below safety limits.",
    "date": "2026-06-05",
    "id": 1780642729,
    "type": "error"
});