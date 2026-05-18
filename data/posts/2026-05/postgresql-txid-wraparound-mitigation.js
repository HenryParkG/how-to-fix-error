window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL Transaction ID Wraparound",
    "slug": "postgresql-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "TXID Wraparound",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system. Because these IDs are finite (~4 billion), the database must eventually 'recycle' them. If the difference between the oldest 'frozen' transaction and the current TXID exceeds 2 billion, the database enters a read-only safety mode to prevent data corruption.</p><p>In high-volume write clusters, the standard autovacuum process often fails to keep up with the rate of ID consumption, especially if long-running transactions or orphaned prepared transactions prevent the 'freeze map' from advancing.</p>",
    "root_cause": "The autovacuum worker is throttled or blocked by long-running transactions, preventing it from marking old rows as 'frozen' before the 2-billion TXID limit is reached.",
    "bad_code": "-- Default settings often too conservative for high-write loads\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2; -- 20% is too high for large tables\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000; -- Default is often too late",
    "solution_desc": "Aggressively tune autovacuum parameters to trigger freezing earlier and faster. Monitor the age of the oldest transaction and use manual VACUUM FREEZE on specific tables during maintenance windows if autovacuum falls behind.",
    "good_code": "-- Tune for aggressive freezing\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.02; \nALTER SYSTEM SET autovacuum_freeze_max_age = 100000000; \nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\n\n-- Identify problematic tables\nSELECT relname, age(relfrozenid) FROM pg_class WHERE relkind = 'r' ORDER BY 2 DESC;",
    "verification": "Query 'pg_database' to monitor 'datfrozenxid' and ensure the age is trending downward after tuning.",
    "date": "2026-05-18",
    "id": 1779086742,
    "type": "error"
});