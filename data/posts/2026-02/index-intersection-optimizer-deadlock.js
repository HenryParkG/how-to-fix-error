window.onPostDataLoaded({
    "title": "Index Intersection: The Hidden Optimizer Deadlock",
    "slug": "index-intersection-optimizer-deadlock",
    "language": "MySQL / InnoDB",
    "code": "IndexMergeDeadlock",
    "tags": [
        "SQL",
        "Databases",
        "InnoDB",
        "Performance",
        "Error Fix"
    ],
    "analysis": "<p>Index Intersection occurs when the database optimizer decides to use two or more secondary indexes to fulfill a query instead of a single index scan. While this can reduce the number of rows fetched from the clustered index, it introduces a dangerous locking pattern. Each secondary index used in the merge must be locked sequentially before the final row lock on the clustered index is acquired.</p><p>The deadlock arises because the order of lock acquisition across these multiple secondary indexes is not guaranteed to be consistent across concurrent transactions. Transaction A might acquire a lock on Index X and then wait for a lock on Index Y. Simultaneously, Transaction B acquires a lock on Index Y and waits for Index X. Because these locks are held until the transaction commits, a circular dependency is created even if both transactions are technically updating the same logical row.</p>",
    "root_cause": "The optimizer's Index Merge plan forces out-of-order lock acquisition across multiple physical index structures before reaching the primary key leaf node.",
    "bad_code": "UPDATE orders SET status = 'processed' WHERE user_id = 123 AND order_tag = 'priority';\n-- Assuming individual indexes exist for user_id and order_tag",
    "solution_desc": "Create a composite index that covers both columns. This forces the optimizer to use a single index path, ensuring atomic lock acquisition and preventing the interleaving of secondary index locks.",
    "good_code": "CREATE INDEX idx_user_tag ON orders(user_id, order_tag);\n\n-- Alternatively, disable index_merge for the specific query\nUPDATE orders SET status = 'processed' \nWHERE user_id = 123 AND order_tag = 'priority' \n/*+ NO_INDEX_MERGE(orders) */;",
    "verification": "Execute 'EXPLAIN' on the problematic query and verify that the 'type' column shows 'ref' or 'range' using the composite index, and the 'Extra' column no longer contains 'Using intersect'.",
    "date": "2026-02-11",
    "id": 1770786572
});