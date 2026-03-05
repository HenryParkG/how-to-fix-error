window.onPostDataLoaded({
    "title": "Preventing PostgreSQL Transaction ID (XID) Wraparound",
    "slug": "postgres-xid-wraparound-vacuum-stalled",
    "language": "SQL",
    "code": "XIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (XID) system. Because 2^32 is finite, the counter eventually wraps around. To prevent old transactions from appearing 'in the future' and causing data loss, PostgreSQL must 'freeze' old rows using the VACUUM process. If VACUUM is stalled\u2014typically by long-running transactions, abandoned replication slots, or orphaned prepared transactions\u2014the XID age grows. If it reaches ~2 billion, the database will forcibly enter read-only mode or shut down to protect data integrity.</p>",
    "root_cause": "Long-running idle-in-transaction sessions or stale replication slots preventing autovacuum from advancing the 'relfrozenxid' horizon.",
    "bad_code": "-- Finding the current max age - if this is > 150 million, you are in danger\nSELECT datname, age(datfrozenxid) \nFROM pg_database \nORDER BY age(datfrozenxid) DESC;",
    "solution_desc": "Identify and terminate sessions blocking vacuuming. Tune autovacuum to be more aggressive by reducing 'autovacuum_vacuum_scale_factor' and increasing 'autovacuum_vacuum_cost_limit'. Ensure replication slots are active or dropped.",
    "good_code": "-- 1. Terminate long running transactions (> 1 hour)\nSELECT pg_terminate_backend(pid) \nFROM pg_stat_activity \nWHERE state != 'idle' \nAND now() - xact_start > interval '1 hour';\n\n-- 2. Drop stale replication slots\nSELECT pg_drop_replication_slot(slot_name) \nFROM pg_replication_slots \nWHERE active = 'f';",
    "verification": "Query 'pg_class' and 'pg_database' to verify that 'age(relfrozenxid)' is decreasing after a manual 'VACUUM FREEZE' operation.",
    "date": "2026-03-05",
    "id": 1772684982,
    "type": "error"
});