window.onPostDataLoaded({
    "title": "MongoDB WiredTiger Oplog Bloat & Cache Stalls",
    "slug": "mongodb-wiredtiger-oplog-bloat-cache-stalls",
    "language": "MongoDB",
    "code": "WiredTigerCacheStall",
    "tags": [
        "Database",
        "Performance",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine maintains an in-memory cache to stage modified pages before reconciling them to disk via checkpoints. When replication traffic or high write workloads cause the oplog to churn rapidly, checkpoint writes and write-ahead journaling compete for disk I/O.</p><p>If the percentage of dirty pages exceeds the default 20% eviction threshold, client operations are hijacked to assist in eviction. This results in severe latency spikes, ticket exhaustion (read/write tickets dropping to zero), and unbounded journal size inflation when disk throughput cannot match cache dirty rates.</p>",
    "root_cause": "High-write throughput saturating the WiredTiger cache dirty page eviction threshold, causing client-side write stalls and unconstrained disk bloat during checkpoint flushes.",
    "bad_code": "# Default mongo startup lacking memory limits and eviction controls in containerized setup\ndocker run -d --name mongo-prod \\\n  -v /var/data/mongo:/data/db \\\n  mongo:6.0 --replSet rs0\n\n# Dynamic workload causes oplog to grow uncontrollably\n# mongosh query showing unmanaged oplog retention:\n# rs.printReplicationInfo() -> shows unconstrained time window causing journal saturation",
    "solution_desc": "Set explicit bounds on the WiredTiger cache size based on available container resources. Resize and cap the replication oplog dynamically with replSetResizeOplog, and adjust WiredTiger dirty cache eviction triggers to begin concurrent background eviction earlier.",
    "good_code": "# Run MongoDB with defined memory boundaries inside Docker\ndocker run -d --name mongo-prod \\\n  -m 16g --memory-swap 16g \\\n  -v /var/data/mongo:/data/db \\\n  mongo:6.0 --replSet rs0 \\\n  --wiredTigerCacheSizeGB 10\n\n# Configure dynamic oplog capping and eviction thresholds via mongosh\ndb.adminCommand({\n  replSetResizeOplog: 1,\n  size: 32768 // Resize oplog to fixed 32GB\n});\n\ndb.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_dirty_target=5,eviction_dirty_trigger=15,eviction_target=75\"\n});",
    "verification": "Monitor 'db.serverStatus().wiredTiger.cache' for 'tracked dirty bytes in the cache'. Confirm that 'wiredTiger.concurrentTransactions.write.out' maintains available write tickets and checkpoint durations stabilize under 10 seconds.",
    "date": "2026-09-16",
    "id": 1789546593,
    "type": "error"
});