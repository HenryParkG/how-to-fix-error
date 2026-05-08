window.onPostDataLoaded({
    "title": "Fixing Spark Shuffle Block Corruption in Large Joins",
    "slug": "spark-shuffle-block-corruption-fix",
    "language": "Java / Scala",
    "code": "CorruptStreamException",
    "tags": [
        "Java",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In multi-petabyte distributed joins, Apache Spark executors transfer massive amounts of data via the Shuffle Service. A 'CorruptStreamException' occurs when the checksum of the fetched shuffle block does not match the expected value. This is frequently seen in high-concurrency environments where Netty's zero-copy transfer mechanism interacts poorly with specific NIC drivers or when local SSDs experience transient IO pressure, leading to partial file writes.</p>",
    "root_cause": "Race conditions in the External Shuffle Service or disk-level silent corruption where the shuffle data file is modified or truncated before the reducer finishes reading it.",
    "bad_code": "// Default configurations often fail at petabyte scale\nspark.shuffle.compress true\nspark.shuffle.spill.compress true",
    "solution_desc": "Enable shuffle checksumming to identify corruption at the source and force a re-computation of the map task. Also, increase the fetch retry wait times and tune the Netty buffer sizes to handle high-latency network spikes that cause TCP stream desynchronization.",
    "good_code": "spark.shuffle.checksum.enabled true\nspark.shuffle.checksum.algorithm ADLER32\nspark.reducer.maxRetries 10\nspark.reducer.maxWaitBetweenRetries 60s\nspark.shuffle.io.backLog 4096",
    "verification": "Monitor the Spark UI for 'FetchFailedException'. After the fix, the logs should show 'Checksum validation passed' and the join should complete without stage retries.",
    "date": "2026-05-08",
    "id": 1778235499,
    "type": "error"
});