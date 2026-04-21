window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Spill and OOM in Skewed Joins",
    "slug": "spark-shuffle-spill-oom-skew",
    "language": "SQL",
    "code": "OOM / Spill",
    "tags": [
        "SQL",
        "Java",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Spark shuffle spills occur when the data for a single partition exceeds the available execution memory (defined by <code>spark.executor.memory * spark.memory.fraction</code>). In skewed joins, a specific key (e.g., a null ID or a high-frequency category) concentrates millions of rows into one task, while others remain idle. This leads to the 'long tail' problem where one task crashes with OutOfMemoryError or thrashes the disk via spilling.</p>",
    "root_cause": "Data skewness on join keys causes an uneven distribution of records across partitions during the shuffle phase, overwhelming individual executor memory buffers.",
    "bad_code": "-- Standard join vulnerable to skew\nSELECT /*+ MERGE(orders) */ * \nFROM orders \nJOIN customers ON orders.customer_id = customers.id;",
    "solution_desc": "Implement 'Salting' on the skewed key. By appending a random integer to the join key in the skewed table and replicating the rows in the smaller dimension table, you redistribute the workload across multiple partitions. Alternatively, use Broadcast Join if one side is small enough.",
    "good_code": "-- Salting approach\nSELECT * \nFROM (SELECT *, floor(rand() * 10) as salt FROM orders) o\nJOIN (SELECT *, explode(sequence(0, 9)) as salt FROM customers) c\nON o.customer_id = c.id AND o.salt = c.salt;",
    "verification": "Monitor the Spark UI 'Stages' tab. Verify that 'Max' task duration and 'Shuffle Spill (Disk)' are significantly reduced and balanced across all tasks.",
    "date": "2026-04-21",
    "id": 1776735964,
    "type": "error"
});