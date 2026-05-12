window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound under Starvation",
    "slug": "postgres-txid-wraparound-vacuum",
    "language": "SQL",
    "code": "Data Loss Risk",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system. To prevent 'wraparound' (where old transactions appear to be in the future), the autovacuum process must 'freeze' old rows. When autovacuum is starved\u2014due to high I/O load, long-running transactions, or misconfiguration\u2014the TXID age approaches 2 billion. At this point, PostgreSQL enters a safety shutdown (read-only mode) to prevent permanent data corruption.</p>",
    "root_cause": "Long-running idle transactions or insufficient autovacuum worker resources prevent the 'vacuum freeze' process from advancing the datfrozenxid.",
    "bad_code": "-- A transaction left open indefinitely\nBEGIN;\nSELECT * FROM heavy_table; \n-- ... app crashes but connection persists ...",
    "solution_desc": "Identify and terminate long-running transactions, increase autovacuum_vacuum_cost_limit to speed up workers, and manually run VACUUM FREEZE on critical tables.",
    "good_code": "-- Check TXID age per database\nSELECT datname, age(datfrozenxid) FROM pg_database;\n\n-- Tune autovacuum for aggressive cleanup\nALTER TABLE large_table SET (autovacuum_vacuum_scale_factor = 0.01);",
    "verification": "Monitor the 'age(datfrozenxid)' metric; it should decrease significantly after a successful freeze vacuum.",
    "date": "2026-05-12",
    "id": 1778574954,
    "type": "error"
});