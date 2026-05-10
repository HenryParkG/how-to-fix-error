window.onPostDataLoaded({
    "title": "Resolving PostgreSQL Write Amplification via HOT Updates",
    "slug": "postgres-hot-update-failures",
    "language": "SQL",
    "code": "WriteAmplification",
    "tags": [
        "SQL",
        "Infra",
        "PostgreSQL",
        "Error Fix"
    ],
    "analysis": "<p>PostgreSQL suffers from write amplification when every UPDATE operation requires updates to all associated indexes. Heap-Only Tuple (HOT) updates mitigate this by placing the new row version on the same data page as the old one, provided no indexed columns are modified and there is sufficient space. If the 'fillfactor' is too high (default 100), pages fill up, forcing HOT updates to fail and triggering expensive index-wide updates for every row modification.</p>",
    "root_cause": "Lack of free space on data pages (low fillfactor headroom) or updates targeting columns that are part of an index.",
    "bad_code": "CREATE TABLE user_metrics (\n    id SERIAL PRIMARY KEY,\n    last_login TIMESTAMP,\n    counter INT\n); -- Default fillfactor=100\nCREATE INDEX idx_metrics_counter ON user_metrics(counter);",
    "solution_desc": "Lower the table's `fillfactor` to reserve space for new tuple versions on the same page and ensure frequently updated columns are not indexed unless absolutely necessary.",
    "good_code": "ALTER TABLE user_metrics SET (fillfactor = 80);\nVACUUM FULL user_metrics; -- Reorganize table to apply fillfactor\n\n-- Avoid indexing columns that update every second\nDROP INDEX idx_metrics_counter;",
    "verification": "Query `pg_stat_user_tables` and compare `n_tup_upd` vs `n_tup_hot_upd` to ensure the HOT hit rate is high.",
    "date": "2026-05-10",
    "id": 1778407562,
    "type": "error"
});