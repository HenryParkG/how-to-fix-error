window.onPostDataLoaded({
    "title": "Mitigating Postgres Index Bloat from Aborted HOT Updates",
    "slug": "postgres-hot-update-index-bloat",
    "language": "SQL",
    "code": "IndexBloat",
    "tags": [
        "SQL",
        "PostgreSQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Heap-Only Tuple (HOT) updates are a performance feature in PostgreSQL that avoids updating indexes if the indexed columns aren't changed and there is space on the same page. However, if a HOT chain becomes too long or is frequently broken by updates to indexed columns\u2014especially when transactions are aborted\u2014the 'dead' tuples cannot be pruned efficiently. This leads to massive index bloat as the system creates new index pointers for what should have been an in-place update.</p>",
    "root_cause": "Updates targeting columns covered by indexes, or insufficient 'fillfactor' on the table, prevent the engine from placing new versions on the same data page, breaking the HOT optimization.",
    "bad_code": "-- Creating table with default fillfactor (100)\nCREATE TABLE telemetry (id serial PRIMARY KEY, val int, ts timestamp);\nCREATE INDEX idx_telemetry_ts ON telemetry(ts);\n-- High frequency updates to 'ts' break HOT optimization\nUPDATE telemetry SET ts = now() WHERE id = 1;",
    "solution_desc": "Adjust the <code>fillfactor</code> of the table to leave free space on each page for HOT updates. Additionally, ensure that high-frequency updates only target non-indexed columns, and keep transactions short to allow autovacuum to prune old tuple versions.",
    "good_code": "-- Lower fillfactor to 80-90% to allow space for HOT updates\nALTER TABLE telemetry SET (fillfactor = 85);\n-- Reorganize table to apply change\nVACUUM FULL telemetry;\n-- Ensure 'ts' is only updated when necessary, or move to a non-indexed column",
    "verification": "Query <code>pg_stat_user_tables</code> and monitor the <code>n_tup_hot_upd</code> vs <code>n_tup_upd</code> ratio. A high ratio indicates healthy HOT usage.",
    "date": "2026-05-02",
    "id": 1777706415,
    "type": "error"
});