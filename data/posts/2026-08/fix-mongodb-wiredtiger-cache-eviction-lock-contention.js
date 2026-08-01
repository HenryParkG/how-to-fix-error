window.onPostDataLoaded({
    "title": "Fix WiredTiger Cache Eviction Contention in MongoDB Upserts",
    "slug": "fix-mongodb-wiredtiger-cache-eviction-lock-contention",
    "language": "MongoDB / C++",
    "code": "WT_CACHE_FULL",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>High-concurrency workloads characterized by rapid bulk upsert queries frequently encounter latency spikes and connection pool exhaustion in MongoDB. Under extreme write velocity, MongoDB's storage engine, WiredTiger, experiences dirty page accumulation that breaches default cache limits (<code>eviction_dirty_trigger</code> at 20% and <code>eviction_dirty_target</code> at 5%).</p><p>When dirty memory reaches the trigger threshold, application client threads are hijacked to perform emergency inline eviction, causing severe mutex lock contention on internal WiredTiger hazard pointers and page locks.</p>",
    "root_cause": "Un-tuned WiredTiger engine parameters allow dirty page accumulation during concurrent upserts, starving background eviction threads and forcing client application threads into synchronous page eviction loops.",
    "bad_code": "// Default client bulk upsert query executing under un-tuned WiredTiger defaults\ndb.analytics.bulkWrite([\n  { updateOne: {\n      filter: { sensor_id: 1042 },\n      update: { $inc: { count: 1 }, $set: { last_updated: new Date() } },\n      upsert: true\n  }}\n], { ordered: false });",
    "solution_desc": "Configure background WiredTiger cache eviction runtime parameters to expand thread pools and lower dirty cache triggers, preventing worker thread hijacking and maintaining steady-state eviction rates.",
    "good_code": "// Administrative adjustment of WiredTiger runtime eviction settings\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction=(threads_min=8,threads_max=16),eviction_dirty_trigger=5,eviction_dirty_target=3\"\n});\n\n// Create compound index to avoid full collection scan and reduce tree dirtying\ndb.analytics.createIndex({ sensor_id: 1 }, { background: true });",
    "verification": "Monitor engine metrics via `db.serverStatus().wiredTiger.cache` and ensure `tracked dirty bytes in the cache` stays safely below trigger thresholds without triggering application thread eviction stutters.",
    "date": "2026-08-01",
    "id": 1785571471,
    "type": "error"
});