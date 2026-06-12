window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound Outages",
    "slug": "postgresql-transaction-id-wraparound-outage",
    "language": "SQL",
    "code": "POSTGRES_TXID_WRAPAROUND",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on 32-bit transaction IDs (txids), yielding roughly 4 billion potential concurrent transactions. To determine visibility in MVCC (Multi-Version Concurrency Control), PostgreSQL uses modulo-2^31 arithmetic. If a system reaches 2 billion active transactions without performing a 'freeze' on old row versions via autovacuum, older transactions suddenly appear to be in the future, rendering data invisible or corrupted.</p><p>To prevent this catastrophic state, PostgreSQL enters an emergency read-only protection mode when `age(datfrozenxid)` reaches `autovacuum_freeze_max_age` (usually 200 million transactions). However, if autovacuum is blocked from completing its work due to long-running user transactions, orphaned replication slots, or uncommitted two-phase commit (2PC) transactions, the database will ultimately shut down and refuse connections entirely until recovered in single-user mode.</p>",
    "root_cause": "Autovacuum blockage by long-lived transactions, dead replication slots, or uncommitted prepared transactions preventing PostgreSQL from advancing 'datfrozenxid' beyond the wraparound safety threshold.",
    "bad_code": "-- A typical administrative pattern leading to autovacuum blockages:\n-- Allowing replication slots to sit idle/dead indefinitely without dropping them\nSELECT slot_name, active FROM pg_replication_slots WHERE active = false;\n\n-- Running massive analytical queries that block locks on active tables for hours\nBEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT * FROM heavy_logs_table; -- Uncommitted session left open for days",
    "solution_desc": "Proactively clean up blocking database objects. Terminate long-running backend sessions, drop inactive replication slots, and rollback forgotten two-phase commit transactions. Once cleared, trigger aggressive manual vacuuming across the database to freeze older transactions and reset the transaction age back to safe limits.",
    "good_code": "-- 1. Find and terminate backend queries running longer than 1 hour\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE state != 'idle' \n  AND query_start < now() - interval '1 hour';\n\n-- 2. Clean out uncommitted prepared (2PC) transactions blocking vacuum\nSELECT gid, prepared, database FROM pg_prepared_xacts;\n-- Run ROLLBACK PREPARED '<gid>' on those returned;\n\n-- 3. Find and drop inactive replication slots\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = false;\n\n-- 4. Force aggressive emergency vacuum on the entire database to freeze tuples\nVACUUM FREEZE ANALYZE VERBOSE;",
    "verification": "Verify transaction age reduction by querying the system catalogs: `SELECT datname, age(datfrozenxid) FROM pg_database;`. Ensure the age falls well below 10,000,000 transactions, well away from the threshold of 200,000,000.",
    "date": "2026-06-12",
    "id": 1781231948,
    "type": "error"
});