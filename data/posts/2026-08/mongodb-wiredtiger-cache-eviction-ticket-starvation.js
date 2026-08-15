window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-starvation",
    "language": "Go / MongoDB",
    "code": "WT_CACHE_DIRTY_EVICTION_STALL",
    "tags": [
        "MongoDB",
        "Docker",
        "Go",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, maintains an in-memory cache and utilizes a ticket-based concurrency model (defaulting to 128 concurrent read and 128 concurrent write tickets). Background eviction worker threads reconcile modified in-memory pages with disk blocks to keep dirty cache percentages within configured boundaries (typically 5-20%).</p><p>Under high-throughput write workloads or unindexed queries loading large collection scans into RAM, dirty pages accumulate faster than background eviction workers can flush them. When the dirty page threshold crosses `eviction_dirty_trigger` (default 20%), WiredTiger forces client application threads to perform synchronous eviction. This causes client operations to block, exhausts all available read/write tickets, and cascades into total query starvation.</p>",
    "root_cause": "Dirty page production rate exceeding disk I/O throughput, causing WiredTiger to shift eviction burdens onto application threads and depleting concurrent transaction tickets.",
    "bad_code": "// Unthrottled Go worker generating massive unindexed bulk updates\npackage main\n\nimport (\n\t\"context\"\n\t\"go.mongodb.org/mongo-driver/bson\"\n\t\"go.mongodb.org/mongo-driver/mongo\"\n)\n\nfunc bulkWriteStarvation(coll *mongo.Collection, largeDocs []interface{}) {\n\t// Unbounded parallel updates force cache dirty ratio > 20%\n\tfor _, doc := range largeDocs {\n\t\tgo func(d interface{}) {\n\t\t\t_, _ = coll.UpdateMany(\n\t\t\t\tcontext.Background(),\n\t\t\t\tbson.M{\"status\": \"pending\"}, // Unindexed filter causing massive page loading\n\t\t\t\tbson.M{\"$set\": bson.M{\"payload\": d}},\n\t\t\t)\n\t\t}(doc)\n\t}\n}",
    "solution_desc": "Tune WiredTiger eviction worker thread counts and trigger thresholds dynamically via `setParameter`, ensure proper indexing on batch predicates, and enforce rate-limited batching with bulk write models instead of unthrottled goroutines.",
    "good_code": "// Tuned bulk processing with bounded concurrency\npackage main\n\nimport (\n\t\"context\"\n\t\"time\"\n\t\"go.mongodb.org/mongo-driver/bson\"\n\t\"go.mongodb.org/mongo-driver/mongo\"\n\t\"go.mongodb.org/mongo-driver/mongo/options\"\n)\n\nfunc executeThrottledBatch(coll *mongo.Collection, updates []mongo.WriteModel) error {\n\tctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n\tdefer cancel()\n\n\t// Process in deterministic chunks of 500 to keep dirty cache below thresholds\n\tbulkOpts := options.BulkWrite().SetOrdered(false)\n\tchunkSize := 500\n\tfor i := 0; i < len(updates); i += chunkSize {\n\t\tend := i + chunkSize\n\t\tif end > len(updates) {\n\t\t\tend = len(updates)\n\t\t}\n\t\t_, err := coll.BulkWrite(ctx, updates[i:end], bulkOpts)\n\t\tif err != nil {\n\t\t\treturn err\n\t\t}\n\t\ttime.Sleep(20 * time.Millisecond) // Yield window for background eviction\n\t}\n\treturn nil\n}",
    "verification": "Check MongoDB server status in `mongosh`: `db.serverStatus().wiredTiger.concurrentTransactions` and `db.serverStatus().wiredTiger.cache[\"tracked dirty pages in the cache\"]`. Ensure dirty pages stay under 5% and available tickets remain stable above 100.",
    "date": "2026-08-15",
    "id": 1786785432,
    "type": "error"
});