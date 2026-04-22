window.onPostDataLoaded({
    "title": "Fixing PostgreSQL Transaction ID Wraparound",
    "slug": "postgres-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. When the XID counter reaches approximately 2 billion, the database must 'wrap around'. If old transactions aren't 'frozen' via VACUUM, the database will shut down to prevent data corruption where old data suddenly appears to be in the future.</p>",
    "root_cause": "High write volume exceeding the autovacuum rate, or long-running transactions preventing the global relfrozenxid from advancing.",
    "bad_code": "-- Default settings often too conservative for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; \n-- Result: Vacuum only triggers after 20% table change, too late for 1TB tables.",
    "solution_desc": "Lower the autovacuum thresholds and increase the worker count to ensure vacuuming happens more aggressively on high-churn tables.",
    "good_code": "ALTER TABLE high_volume_table SET (\n  autovacuum_vacuum_scale_factor = 0.01,\n  autovacuum_vacuum_cost_limit = 1000,\n  autovacuum_freeze_max_age = 100000000\n);",
    "verification": "Monitor XID age using: SELECT datname, age(datfrozenxid) FROM pg_database;",
    "date": "2026-04-22",
    "id": 1776835085,
    "type": "error"
});