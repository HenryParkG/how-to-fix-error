window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Stalls & Ticket Exhaustion",
    "slug": "mongodb-wiredtiger-cache-eviction-ticket-exhaustion",
    "language": "MongoDB / Python",
    "code": "WT_TICKET_EXHAUSTION",
    "tags": [
        "Python",
        "Docker",
        "Database",
        "MongoDB",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's storage engine, WiredTiger, coordinates concurrent memory operations using read and write tickets (defaulting to 128 each). When memory-heavy workloads, unindexed query scans, or high update frequencies cause the dirty data percentage or overall cache usage to breach configured limits (e.g., 20% dirty, 80% total cache), WiredTiger transitions from background eviction to foreground application eviction. Client worker threads attempting read/write operations are forcibly converted into page-eviction workers. This stalls new requests, drains available read/write tickets down to zero, inflates connection pool counts, and causes severe request timeouts across services.</p>",
    "root_cause": "Exhaustion of WiredTiger read/write concurrency tickets triggered by application threads becoming trapped in synchronous cache eviction due to high dirty page ratios, unindexed queries saturating RAM, or mismatched cache size limits.",
    "bad_code": "from pymongo import MongoClient\n\n# Unconstrained connection pool combined with full collection scans\nclient = MongoClient(\n    \"mongodb://mongo1:27017,mongo2:27017/?replicaSet=rs0\",\n    maxPoolSize=2000, # Triggers ticket starvation under load\n    waitQueueTimeoutMS=1000\n)\ndb = client[\"analytics\"]\n\ndef run_pipeline(tenant_id):\n    # Unindexed query forcing millions of documents into WiredTiger cache\n    return db.events.find({\"tenant_id\": tenant_id, \"status\": \"PROCESSED\"}).sort(\"ts\", -1)",
    "solution_desc": "Eliminate full collection memory loads by applying compound covering indexes. Scale back client connection pools to align with WiredTiger's internal concurrency limits. Tune WiredTiger runtime engine configuration to initiate background evictions earlier and dedicate more background worker threads to cache reclamation.",
    "good_code": "from pymongo import MongoClient, ASCENDING, DESCENDING\n\nclient = MongoClient(\n    \"mongodb://mongo1:27017,mongo2:27017/?replicaSet=rs0\",\n    maxPoolSize=128, # Match concurrency limits to engine tickets\n    minPoolSize=16,\n    waitQueueTimeoutMS=5000\n)\ndb = client[\"analytics\"]\n\n# 1. Compound index covers query without scanning extra documents into cache\ndb.events.create_index([\n    (\"tenant_id\", ASCENDING),\n    (\"status\", ASCENDING),\n    (\"ts\", DESCENDING)\n], background=True)\n\n# 2. Reconfigure WiredTiger to start eviction earlier to protect ticket queues\nadmin_db = client[\"admin\"]\nadmin_db.command({\n    \"setParameter\": 1,\n    \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_dirty_target=5,eviction_dirty_trigger=15,eviction=(threads_min=4,threads_max=8)\"\n})\n\ndef run_pipeline(tenant_id):\n    return db.events.find(\n        {\"tenant_id\": tenant_id, \"status\": \"PROCESSED\"},\n        projection={\"_id\": 0, \"tenant_id\": 1, \"status\": 1, \"ts\": 1}\n    ).sort(\"ts\", -1)",
    "verification": "Execute `db.serverStatus().wiredTiger.concurrentTransactions` in `mongosh` during peak workload. Confirm `read.available` and `write.available` remain consistently above 20, and inspect `db.serverStatus().wiredTiger.cache['tracked dirty bytes in the cache']` to ensure dirty page eviction stays below the 15% threshold.",
    "date": "2026-10-28",
    "id": 1793188559,
    "type": "error"
});