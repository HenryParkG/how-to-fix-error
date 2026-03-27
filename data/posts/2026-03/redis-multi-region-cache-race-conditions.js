window.onPostDataLoaded({
    "title": "Fixing Cache Race Conditions in Multi-Region Redis",
    "slug": "redis-multi-region-cache-race-conditions",
    "language": "Go / Redis",
    "code": "Race Condition",
    "tags": [
        "Redis",
        "Distributed Systems",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In multi-region architectures, a common race condition occurs when a write in the primary region triggers an invalidation across secondary regions. Due to replication lag, a 'Read-Through' event in a secondary region might fetch stale data from a local read-replica before the cross-region update has arrived, subsequently repopulating the cache with old data (the 'stale set' problem).</p><p>This is particularly dangerous in systems with high read-concurrency where the window of replication lag (often 50-500ms) is enough to poison the cache for the duration of the TTL.</p>",
    "root_cause": "Replication lag between the global primary database and regional read-replicas causes the cache to be repopulated with stale data after an invalidation but before the replica has synchronized.",
    "bad_code": "func updateData(key string, val string) {\n  db.Write(key, val) // Primary Region\n  redis.Del(key)      // Global Invalidation\n}\n\n// In Secondary Region\nfunc getData(key string) {\n  val := redis.Get(key)\n  if val == nil {\n    val = replicaDb.Read(key) // READS STALE DATA DUE TO LAG\n    redis.Set(key, val, ttl)\n  }\n}",
    "solution_desc": "Implement a 'Delayed Double Deletion' strategy or use a 'Lease' mechanism. By deleting the key, waiting for a duration longer than the maximum expected replication lag, and deleting it again, you ensure any stale data cached during the lag window is evicted.",
    "good_code": "func updateData(key string, val string) {\n  db.Write(key, val)\n  redis.Del(key)\n  // Schedule a second delete after replication lag\n  time.AfterFunc(500 * time.Millisecond, func() {\n    redis.Del(key)\n  })\n}",
    "verification": "Monitor 'Cache Hit' data immediately following a write. If the value returned matches the old state, the race condition persists. Use distributed tracing to measure the delta between primary write and replica consistency.",
    "date": "2026-03-27",
    "id": 1774574651,
    "type": "error"
});