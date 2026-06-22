window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Deadlocks",
    "slug": "fixing-wiredtiger-cache-eviction-deadlocks",
    "language": "MongoDB / Go",
    "code": "WiredTiger Deadlock",
    "tags": [
        "Go",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Under extreme, sustained write loads, MongoDB cluster nodes can suddenly freeze and become unresponsive to heartbeats, eventually causing replica set elections or complete cascading failures. This issue occurs when the WiredTiger storage engine's cache becomes completely saturated with dirty pages. As client write operations continue to pour in, they overwhelm the background eviction threads. When the dirty data exceeds critical thresholds, WiredTiger forces client write threads to participate in page eviction. Under highly concurrent workloads, these worker threads end up locking the same pages they are attempting to evict, triggering a resource starvation spiral or lock deadlock.</p>",
    "root_cause": "When dirty data in the WiredTiger cache exceeds the 'eviction_dirty_trigger' (default 20%), user threads are forced to perform page eviction in-line with their write operations. Under massive concurrent loads, client threads compete aggressively with background eviction threads for the global WT_TXN state and page locks, leading to lock contention stalls where no thread can make progress.",
    "bad_code": "db.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=80,eviction_trigger=95\"\n});\n\n// Bad Client write pattern in Go with zero rate-limiting/backpressure\nfunc writeToMongo(ctx context.Context, collection *mongo.Collection, docs []interface{}) {\n\tfor {\n\t\tgo func() {\n\t\t\t_, err := collection.InsertMany(ctx, docs)\n\t\t\tif err != nil {\n\t\t\t\tlog.Printf(\"Error writing: %v\", err)\n\t\t\t}\n\t\t}()\n\t}\n}",
    "solution_desc": "To resolve this deadlock, we must tune WiredTiger's internal eviction parameters to start evicting dirty pages much earlier and aggressively assign more background threads. Simultaneously, we implement a semaphore-based token bucket on the client application to apply deterministic backpressure, ensuring write volume never fully saturates the database engine's cache.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=85,eviction_dirty_target=5,eviction_dirty_trigger=10,eviction_workers_min=4,eviction_workers_max=12\"\n});\n\n// Refactored client with semaphore-based rate limiting\nfunc writeToMongoSafe(ctx context.Context, collection *mongo.Collection, docs []interface{}) {\n\tsem := make(chan struct{}, 100) // limit concurrent writes\n\tfor {\n\t\tsem <- struct{}{}\n\t\tgo func() {\n\t\t\tdefer func() { <-sem }()\n\t\t\t_, err := collection.InsertMany(ctx, docs)\n\t\t\tif err != nil {\n\t\t\t\tlog.Printf(\"Error writing: %v\", err)\n\t\t\t}\n\t\t}()\n\t}\n}",
    "verification": "Deploy the updated configurations and client rate limits, then execute a synthetic benchmark reproducing 100k writes/sec. Monitor the metrics via 'db.serverStatus().wiredTiger.cache'. Verify that 'tracked dirty bytes in the cache' stays consistently below 10% and that the eviction threads keep up without blocking client operations.",
    "date": "2026-06-22",
    "id": 1782096622,
    "type": "error"
});