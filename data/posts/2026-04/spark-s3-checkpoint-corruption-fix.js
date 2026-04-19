window.onPostDataLoaded({
    "title": "Fixing Spark S3 Checkpoint Corruption",
    "slug": "spark-s3-checkpoint-corruption-fix",
    "language": "Java",
    "code": "CheckpointReadException",
    "tags": [
        "Java",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Spark Structured Streaming relies on checkpointing to maintain state. In multi-region S3 deployments, cross-region replication latency can cause a 'split-brain' scenario. If a Spark job fails over to a secondary region, it may read a stale version of the 'metadata' or 'offsets' file because S3 replication is asynchronously consistent, leading to a corruption error or data loss during the restart.</p>",
    "root_cause": "Non-atomic renames in S3 and eventual consistency delays during cross-region replication of checkpoint metadata files.",
    "bad_code": "spark.writeStream\n  .format(\"parquet\")\n  .option(\"checkpointLocation\", \"s3://my-bucket/checkpoint/\")\n  .start(\"s3://my-bucket/output/\");",
    "solution_desc": "Use the S3A Committers (specifically the Magic or Staging committer) and ensure 'fs.s3a.metadatastore.impl' is configured if using older Hadoop versions. For multi-region, use a single source of truth for checkpoints (like a regional HDFS or EFS) rather than replicated S3 buckets.",
    "good_code": "spark.conf.set(\"spark.hadoop.fs.s3a.committer.name\", \"directory\")\nspark.conf.set(\"spark.hadoop.fs.s3a.committer.staging.conflict-mode\", \"append\")\nspark.conf.set(\"spark.sql.streaming.checkpointFileManagerClass\", \"org.apache.spark.sql.execution.streaming.CheckpointFileManager$S3ARenameBasedCheckpointFileManager\")",
    "verification": "Perform a simulated regional failover and verify that the 'last-committed-batch' in the secondary region matches the source.",
    "date": "2026-04-19",
    "id": 1776576105,
    "type": "error"
});