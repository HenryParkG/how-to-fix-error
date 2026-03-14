window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-transaction-id-wraparound-fix",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the counter reaches approximately 2 billion transactions, the system faces 'wraparound,' where old transactions appear to be in the future, causing data invisibility or corruption. In high-throughput write clusters, the autovacuum process may fail to 'freeze' old tuples fast enough, especially if blocked by long-running transactions or misconfigured maintenance parameters, eventually forcing the database into read-only mode to prevent data loss.</p>",
    "root_cause": "The datfrozenxid value in pg_database fails to advance because autovacuum is throttled or blocked by long-running idle transactions, leading to the exhaustion of the 2^31 transaction ID space.",
    "bad_code": "-- Risky: Disabling autovacuum or keeping transactions open for days\nALTER TABLE large_table SET (autovacuum_enabled = false);\n-- Query identifying the danger\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;",
    "solution_desc": "Tune autovacuum parameters to be more aggressive (increase worker count and decrease vacuum_cost_limit). Identify and terminate long-running transactions. Manually run VACUUM FREEZE on the oldest tables to advance the relfrozenxid.",
    "good_code": "-- Tune settings for high-throughput\nALTER SYSTEM SET autovacuum_max_workers = 6;\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\n-- Aggressive freezing on specific tables\nVACUUM FREEZE VERBOSE heavy_write_table;",
    "verification": "Monitor the 'age(datfrozenxid)' metric. Ensure it stays significantly below 200 million (the default autovacuum_freeze_max_age).",
    "date": "2026-03-14",
    "id": 1773480255,
    "type": "error"
});