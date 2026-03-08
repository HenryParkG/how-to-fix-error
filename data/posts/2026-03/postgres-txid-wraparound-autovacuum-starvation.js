window.onPostDataLoaded({
    "title": "Resolving PostgreSQL TXID Wraparound and Starvation",
    "slug": "postgres-txid-wraparound-autovacuum-starvation",
    "language": "SQL",
    "code": "TXIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit Transaction ID (TXID). After ~4 billion transactions, the ID wraps around to zero. To prevent data loss (where old transactions suddenly appear in the future), PostgreSQL uses 'FREEZE' via Autovacuum. If Autovacuum is starved (due to long-running queries or heavy write load), the database will eventually enter read-only mode to prevent TXID wraparound, causing a massive outage.</p>",
    "root_cause": "High transaction throughput combined with insufficient Autovacuum frequency, preventing the 'age' of the oldest transaction from being reduced.",
    "bad_code": "-- Current dangerous settings in postgresql.conf\nautovacuum_max_workers = 3\nautovacuum_naptime = 1min\nautovacuum_freeze_max_age = 200000000 -- Default too low for high-load systems",
    "solution_desc": "Tune Autovacuum parameters to be more aggressive and manually identify/kill long-running transactions that prevent vacuuming from cleaning up old TXIDs.",
    "good_code": "-- 1. Tune for faster vacuuming\nALTER SYSTEM SET autovacuum_vacuum_cost_limit = 1000;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;\n-- 2. Identify oldest transactions\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY age(datfrozenxid) DESC;\n-- 3. Force manual freeze if critical\nVACUUM FREEZE VERBOSE table_name;",
    "verification": "Execute 'SELECT age(datfrozenxid) FROM pg_database;'. The result should be significantly lower than 200 million and decreasing after vacuuming.",
    "date": "2026-03-08",
    "id": 1772944141,
    "type": "error"
});