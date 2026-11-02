window.onPostDataLoaded({
    "title": "Resolving WiredTiger Cache Eviction & Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-exhaustion",
    "language": "Python",
    "code": "WriteConflict / Available tickets: 0",
    "tags": [
        "Python",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained write-heavy workloads, MongoDB instances can experience sudden latency spikes where operations stall and the database becomes unresponsive. Diagnostic monitoring reveals that <code>wiredTiger.concurrentTransactions.write.available</code> drops to 0, signaling ticket exhaustion. This condition occurs when the WiredTiger storage engine cannot reconcile dirty cache pages to disk fast enough, forcing foreground client threads into synchronous eviction routines instead of processing read and write queries.</p><p>When client threads are repurposed for internal page eviction, request queues back up, application connection pools exhaust available sockets, and cascaded timeout failures propagate throughout the microservice layer.</p>",
    "root_cause": "The proportion of dirty pages in the WiredTiger cache exceeds the `eviction_dirty_trigger` threshold (typically 20%), which forces client application threads to perform synchronous page reconciliation, consuming all 128 default read/write tickets.",
    "bad_code": "from pymongo import MongoClient\n\nclient = MongoClient(\"mongodb://primary.cluster.local:27017/\")\ndb = client[\"analytics\"]\n\ndef ingest_events_bad(events):\n    # BUG: Individual unbatched updates on unindexed, high-write volume\n    # Floods WiredTiger cache with dirty pages, exhausting write tickets\n    for event in events:\n        db.metrics.update_one(\n            {\"device_id\": event[\"device_id\"], \"timestamp\": event[\"timestamp\"]},\n            {\"$inc\": {\"counter\": 1}, \"$set\": {\"payload\": event[\"data\"]}},\n            upsert=True\n        )",
    "solution_desc": "Architecturally mitigate ticket exhaustion by: 1) Dynamically tuning WiredTiger eviction triggers via `adminCommand` so background threads initiate eviction earlier; 2) Migrating high-volume single operations to chunked `bulk_write` with bounded concurrency; 3) Ensuring proper compound indexes exist to prevent full collection scans from populating the cache with transient clean pages.",
    "good_code": "from pymongo import MongoClient, UpdateOne\n\nclient = MongoClient(\"mongodb://primary.cluster.local:27017/\", maxPoolSize=50)\ndb = client[\"analytics\"]\n\ndef configure_wiredtiger_eviction(client):\n    # Lower triggers to force background threads to evict dirty pages earlier\n    client.admin.command({\n        \"setParameter\": 1,\n        \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=85,eviction_dirty_target=5,eviction_dirty_trigger=15\"\n    })\n\ndef ingest_events_optimized(events, chunk_size=500):\n    operations = [\n        UpdateOne(\n            {\"device_id\": event[\"device_id\"], \"timestamp\": event[\"timestamp\"]},\n            {\"$inc\": {\"counter\": 1}, \"$set\": {\"payload\": event[\"data\"]}},\n            upsert=True\n        )\n        for event in events\n    ]\n    for i in range(0, len(operations), chunk_size):\n        db.metrics.bulk_write(operations[i:i + chunk_size], ordered=False)",
    "verification": "Inspect WiredTiger operational metrics via `db.serverStatus().wiredTiger.concurrentTransactions` and `db.serverStatus().wiredTiger.cache`. Confirm that `concurrentTransactions.write.available` maintains headroom (>20 tickets) and `tracked dirty bytes in the cache` stays below 15% under peak ingest.",
    "date": "2026-11-02",
    "id": 1793590707,
    "type": "error"
});