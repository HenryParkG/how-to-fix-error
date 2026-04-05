window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-xid-wraparound-fix",
    "language": "SQL",
    "code": "Read-Only Mode",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the XID counter reaches approximately 2 billion transactions, the database risks 'wraparound,' where old transactions appear to be in the future, causing data invisibility. To prevent this, PostgreSQL enters a safety-critical read-only mode. This typically happens when 'autovacuum' cannot keep up with the transaction rate or is blocked by long-running transactions or orphaned prepared transactions that prevent the 'frozen XID' from advancing.</p>",
    "root_cause": "Autovacuum failure to freeze tuples due to long-standing transactions or inadequate vacuum performance settings.",
    "bad_code": "-- Identify if you are in danger\nSELECT datname, age(datfrozenxid) FROM pg_database WHERE age(datfrozenxid) > 1500000000;",
    "solution_desc": "Identify and kill long-running backends, then perform a manual VACUUM FREEZE on the oldest tables. Tune autovacuum parameters to be more aggressive by increasing worker counts and reducing cost delay.",
    "good_code": "-- Kill blockers and force vacuum\nSELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != 'idle' AND age(backend_xid) > 1000000;\nVACUUM FREEZE VERBOSE analyze;",
    "verification": "Run 'SELECT age(relfrozenxid) FROM pg_class' and confirm the age significantly drops below 200 million.",
    "date": "2026-04-05",
    "id": 1775352514,
    "type": "error"
});