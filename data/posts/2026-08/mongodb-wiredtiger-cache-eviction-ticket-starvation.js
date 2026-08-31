window.onPostDataLoaded({
    "title": "MongoDB WiredTiger Cache Eviction & Ticket Starvation",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-starvation",
    "language": "MongoDB / Go",
    "code": "WiredTigerTicketExhaustion",
    "tags": [
        "Go",
        "SQL",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Under heavy concurrent read/write workloads with a working set exceeding available RAM, MongoDB's WiredTiger storage engine frequently exhausts its default ticket allotment (128 read/write tickets). When dirty cache pages cross the internal eviction thresholds (typically 20% dirty or 80% total cache usage), WiredTiger forces application worker threads to perform foreground page reconciliation and disk flushing. This degrades throughput and induces severe connection queuing.</p>",
    "root_cause": "Unindexed queries and large un-batched write operations flood the WiredTiger cache with dirty pages faster than background eviction servers can write them to disk, exhausting concurrency tickets and drafting client threads into synchronous eviction routines.",
    "bad_code": "func updateMetrics(ctx context.Context, coll *mongo.Collection, events []MetricEvent) error {\n    // Anti-pattern: High-concurrency unindexed mass updates cause dirty page spikes\n    for _, event := range events {\n        go func(e MetricEvent) {\n            _, err := coll.UpdateMany(ctx,\n                bson.M{\"device_id\": e.DeviceID, \"processed\": false},\n                bson.M{\"$set\": bson.M{\"value\": e.Value, \"processed\": true, \"updated_at\": time.Now()}},\n            )\n            if err != nil {\n                log.Printf(\"write failed: %v\", err)\n            }\n        }(event)\n    }\n    return nil\n}",
    "solution_desc": "Batch writes into bounded chunks, ensure compound indexes to prevent full-collection scans in cache memory, throttle concurrent client operations with a worker pool, and optimize dirty page generation rates to avoid triggering foreground application thread eviction.",
    "good_code": "func updateMetricsBatched(ctx context.Context, coll *mongo.Collection, events []MetricEvent) error {\n    const batchSize = 500\n    models := make([]mongo.WriteModel, 0, batchSize)\n\n    for i, event := range events {\n        filter := bson.M{\"device_id\": event.DeviceID, \"processed\": false}\n        update := bson.M{\"$set\": bson.M{\"value\": event.Value, \"processed\": true, \"updated_at\": time.Now()}}\n        models = append(models, mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update))\n\n        if len(models) == batchSize || i == len(events)-1 {\n            opts := options.BulkWrite().SetOrdered(false)\n            if _, err := coll.BulkWrite(ctx, models, opts); err != nil {\n                return fmt.Errorf(\"bulk write failure: %w\", err)\n            }\n            models = models[:0]\n        }\n    }\n    return nil\n}",
    "verification": "Inspect WiredTiger operational metrics via `db.serverStatus().wiredTiger.concurrentTransactions` and ensure `out` tickets remain well below allocation caps while `cache.pages evicted by application threads` remains zero.",
    "date": "2026-08-31",
    "id": 1788167452,
    "type": "error"
});