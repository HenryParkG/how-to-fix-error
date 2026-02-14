window.onPostDataLoaded({
    "title": "PostgreSQL TXID Wraparound: Rescuing Forced Read-Only DBs",
    "slug": "postgresql-txid-wraparound-rescue",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "Infra",
        "SQL",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) counter. When this counter reaches approximately 2 billion transactions, the system risks 'wraparound' where old transactions appear to be in the future. To prevent data corruption, PostgreSQL enters a safety-critical forced read-only mode. Once this threshold is crossed, the database will refuse to accept any WRITE commands until a manual intervention cleans up the old transaction IDs through a process called freezing.</p>",
    "root_cause": "The Autovacuum daemon failed to keep up with the transaction volume, or a long-running transaction/replication slot prevented the 'relfrozenxid' from advancing, leading to counter exhaustion.",
    "bad_code": "-- Symptom: Database logs show:\n-- ERROR: database is shut down to avoid wraparound failures\n-- HINT: Stop the postmaster and vacuum that database in single-user mode.",
    "solution_desc": "Shut down the database and restart in single-user mode to run a manual VACUUM FREEZE. Alternatively, if the DB is still responsive, identify the oldest tables and run an aggressive VACUUM specifically on them while increasing autovacuum worker priority.",
    "good_code": "-- 1. Find oldest tables\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY 2 DESC;\n\n-- 2. Force aggressive freezing\nVACUUM FREEZE VERBOSE table_name;",
    "verification": "Monitor the 'age(relfrozenxid)' for all databases. Ensure it drops significantly below the 'autovacuum_freeze_max_age' setting.",
    "date": "2026-02-14",
    "id": 1771043298,
    "type": "error"
});