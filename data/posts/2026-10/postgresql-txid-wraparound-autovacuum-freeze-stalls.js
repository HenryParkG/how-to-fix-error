window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound and Autovacuum Stalls",
    "slug": "postgresql-txid-wraparound-autovacuum-freeze-stalls",
    "language": "PostgreSQL",
    "code": "ERR_TXID_WRAPAROUND",
    "tags": [
        "PostgreSQL",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL relies on Multiversion Concurrency Control (MVCC) where transaction IDs (32-bit integers) naturally wrap around every ~4 billion transactions. To prevent historical rows from becoming invisible or appearing in the future, autovacuum triggers aggressive freeze operations when <code>autovacuum_freeze_max_age</code> is reached. When IOPS is throttled or lock contention occurs, vacuum workers stall. Once the age reaches 2 billion, the database halts all writes and enters emergency read-only mode to prevent silent data corruption.</p>",
    "root_cause": "Default autovacuum throttle settings (such as low vacuum_cost_limit and high cost_delay) prevent freeze workers from completing scans in high-throughput write environments, allowing relfrozenxid to breach autovacuum_freeze_max_age and trigger emergency forced vacuums.",
    "bad_code": "-- Default or unoptimized settings leading to starvation\nautovacuum_vacuum_cost_delay = 20ms\nautovacuum_vacuum_cost_limit = 200\nautovacuum_max_workers = 3\nmaintenance_work_mem = 64MB\nautovacuum_freeze_max_age = 200000000",
    "solution_desc": "Scale up autovacuum processing throughput by elevating maintenance_work_mem and vacuum_cost_limit while drastically reducing cost_delay. In active emergency wraparound states, manually run VACUUM FREEZE with max parallel workers and higher maintenance memory limits directly against critical tables.",
    "good_code": "-- postgresql.conf optimized for high throughput freeze\nmaintenance_work_mem = 2GB\nautovacuum_vacuum_cost_delay = 2ms\nautovacuum_vacuum_cost_limit = 2000\nautovacuum_max_workers = 6\nautovacuum_vacuum_scale_factor = 0.05\n\n-- Manual mitigation on critical lagging relations:\nSET maintenance_work_mem = '4GB';\nVACUUM FREEZE VERBOSE ANALYZE public.orders;",
    "verification": "Execute `SELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY age(relfrozenxid) DESC LIMIT 10;` to verify all tables have transaction ages well below 200 million.",
    "date": "2026-10-12",
    "id": 1791775636,
    "type": "error"
});