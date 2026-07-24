window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Eviction Stall Cascades",
    "slug": "mongodb-wiredtiger-cache-eviction-stall-cascades",
    "language": "MongoDB",
    "code": "WT_CACHE_FULL",
    "tags": [
        "Docker",
        "AWS",
        "SQL",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Under write-heavy ingestion loads, MongoDB instances utilizing the WiredTiger storage engine can experience latency spikes and throughput collapse known as stall cascades. When dirty cache memory breaches configured trigger thresholds (e.g., <code>eviction_dirty_trigger</code>), database worker threads stop serving client operations and are forced to participate directly in foreground eviction. This creates severe backpressure, queue buildup, and database stalls.</p>",
    "root_cause": "Unthrottled write operations generate dirty pages faster than WiredTiger's background eviction threads can persist them to disk, forcing active operation threads into synchronous page evictions.",
    "bad_code": "// Unthrottled parallel updates causing dirty page buildup in WiredTiger cache\nconst { MongoClient } = require('mongodb');\nconst client = new MongoClient('mongodb://localhost:27017');\n\nasync function rapidIngest() {\n  const db = client.db('telemetry');\n  const col = db.collection('events');\n  // Unbatched high-frequency writes fill WiredTiger cache with dirty pages\n  const ops = Array.from({ length: 20000 }).map((_, i) =>\n    col.updateOne({ _id: i }, { $set: { data: 'x'.repeat(2048), ts: new Date() } }, { upsert: true })\n  );\n  await Promise.all(ops);\n}",
    "solution_desc": "Reconfigure WiredTiger eviction parameters in `mongod.conf` to increase background eviction thread count and trigger lower eviction thresholds earlier. Combine this with client-side bulk write batching and rate limiting.",
    "good_code": "# mongod.conf - Optimized WiredTiger settings for heavy write workloads\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=3,eviction_dirty_trigger=5,eviction_target=70,eviction_trigger=75\"\n\n# Client-side ingestion fix using ordered bulk operations\n# const bulk = col.initializeUnorderedBulkOp();\n# ops.forEach(op => bulk.find(...).upsert().updateOne(...));\n# await bulk.execute();",
    "verification": "Monitor `db.serverStatus().wiredTiger.cache` metrics (\"tracked dirty bytes in the cache\", \"eviction server worker threads active\"). Ensure dirty cache percentage stays below 5% under load and zero application threads enter synchronous eviction state.",
    "date": "2026-07-24",
    "id": 1784880520,
    "type": "error"
});