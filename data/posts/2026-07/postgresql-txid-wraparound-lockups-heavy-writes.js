window.onPostDataLoaded({
    "title": "Fixing PostgreSQL TXID Wraparound Lockups Under Heavy Writes",
    "slug": "postgresql-txid-wraparound-lockups-heavy-writes",
    "language": "PostgreSQL",
    "code": "TXIDWraparoundLockup",
    "tags": [
        "PostgreSQL",
        "Database",
        "Performance",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses 32-bit transaction IDs (TXID), providing approximately 4 billion transactions. Because TXID comparison relies on modulo arithmetic, half the space (~2 billion transactions) represents the past and half represents the future. To prevent old transactions from appearing in the future, PostgreSQL uses vacuuming to freeze old tuples.</p><p>Under extreme write workloads, autovacuum workers can fall behind due to restrictive cost limits or lock contention. When the oldest unfrozen transaction age crosses <code>autovacuum_freeze_max_age</code>, PostgreSQL enters aggressive emergency autovacuum mode, acquiring heavy locks and throttling writes to prevent transaction ID wraparound data corruption.</p>",
    "root_cause": "Default autovacuum cost settings (autovacuum_vacuum_cost_limit) throttled worker speed, combined with long-running read transactions blocking xmin horizons, preventing old row versions from being frozen before reaching critical age threshold.",
    "bad_code": "-- Default or misconfigured settings causing autovacuum starvation under heavy write workloads\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 200; -- Too restrictive for write-heavy engines\nALTER SYSTEM SET autovacuum_max_workers = 3;\n\n-- Long running query that holds back xmin horizon for hours\nBEGIN;\nSELECT * FROM large_analytical_table WHERE created_at < NOW() - INTERVAL '12 hours';\n-- Transaction remains uncommitted while heavy write batch runs concurrently...",
    "solution_desc": "Increase autovacuum cost limits and workers, set aggressive vacuum freeze parameters on high-churn tables, and implement automated cancellation of long-running transactions that block the xmin horizon.",
    "good_code": "-- Tune Postgres configuration for high write throughput and aggressive freezing\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;\nALTER SYSTEM SET autovacuum_vacuum_cost_delay = '2ms';\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60000'; -- 60s max idle in transaction\nALTER SYSTEM SET max_standby_streaming_delay = '30s';\nSELECT pg_reload_conf();\n\n-- Set table-specific aggressive vacuum parameters for hyper-active write tables\nALTER TABLE hyper_write_events SET (\n    autovacuum_vacuum_scale_factor = 0.05,\n    autovacuum_freeze_max_age = 100000000,\n    autovacuum_vacuum_cost_limit = 5000\n);",
    "verification": "Monitor transaction ID age across databases using `SELECT datname, age(datfrozenxid) FROM pg_database;`. Ensure max age stays well below 200 million transactions under sustained peak writes.",
    "date": "2026-07-28",
    "id": 1785202992,
    "type": "error"
});