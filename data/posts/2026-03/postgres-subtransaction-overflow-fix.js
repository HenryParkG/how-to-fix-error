window.onPostDataLoaded({
    "title": "Eliminating PostgreSQL Subtransaction Cache Overflows",
    "slug": "postgres-subtransaction-overflow-fix",
    "language": "SQL",
    "code": "SUBXID_OVERFLOW",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency PostgreSQL clusters, exceeding 64 nested subtransactions (typically from SAVEPOINTs or exception handling in loops) triggers an overflow of the SUBXID cache. This forces every backend to perform disk I/O to check transaction visibility, leading to massive contention on SubtransControlLock.</p>",
    "root_cause": "The PGPROC struct has a fixed 64-slot subtransaction array; exceeding this moves subtransaction data to SLRU buffers, causing global lock contention.",
    "bad_code": "DO $$\nBEGIN\n  FOR i IN 1..1000 LOOP\n    BEGIN\n      INSERT INTO logs VALUES (i);\n    EXCEPTION WHEN OTHERS THEN\n      -- This creates a subtransaction for every iteration\n      NULL;\n    END;\n  END LOOP;\nEND $$;",
    "solution_desc": "Batch operations to reduce the number of internal savepoints and move exception handling to the application layer. If using an ORM like Hibernate or Django, disable automatic transaction nested-savepoints for bulk operations.",
    "good_code": "-- Application layer logic (Pseudocode)\ntry:\n    with connection.atomic():\n        cursor.executemany(\"INSERT INTO logs...\", data)\nexcept DatabaseError:\n    # Handle error at the app level, avoiding DB-side SAVEPOINT loops\n    logger.error(\"Bulk insert failed\")",
    "verification": "Monitor pg_stat_activity for 'SubtransControlLock' wait events and check 'pg_subtrans' SLRU cache hits using pg_stat_slru.",
    "date": "2026-03-20",
    "id": 1773969354,
    "type": "error"
});