window.onPostDataLoaded({
    "title": "Mitigating PostgreSQL TXID Wraparound in Heavy Clusters",
    "slug": "postgres-txid-wraparound-mitigation",
    "language": "SQL",
    "code": "TransactionIDWraparound",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL uses a 32-bit transaction ID (TXID) system. In write-heavy clusters, the TXID counter can approach the 2.1 billion limit. If the system reaches 'wraparound', it forces a shutdown to prevent data corruption. This usually happens when autovacuum cannot keep up with the rate of new transactions, preventing the 'frozen' status of old rows.</p>",
    "root_cause": "Stale replication slots or long-running transactions preventing autovacuum from advancing the 'relfrozenxid'.",
    "bad_code": "-- Default settings often insufficient for 10k+ TPS\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;\nALTER SYSTEM SET autovacuum_naptime = '1min';",
    "solution_desc": "Tun autovacuum to be more aggressive, manually freeze tables using VACUUM FREEZE, and monitor the age of the oldest transaction ID.",
    "good_code": "-- Tune for high throughput\nALTER SYSTEM SET autovacuum_max_workers = 8;\nALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;\nALTER SYSTEM SET autovacuum_freeze_max_age = 200000000;\n\n-- Identify problematic tables\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = 'r' ORDER BY 2 DESC;",
    "verification": "Monitor 'pg_stat_activity' for long-running transactions and track 'age(datfrozenxid)' via Prometheus/Grafana.",
    "date": "2026-05-09",
    "id": 1778305225,
    "type": "error"
});