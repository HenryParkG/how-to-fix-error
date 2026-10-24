window.onPostDataLoaded({
    "title": "Fix MongoDB WiredTiger Cache Eviction Deadlocks",
    "slug": "mongodb-wiredtiger-cache-eviction-deadlocks",
    "language": "Python",
    "code": "WT_CACHE_FULL",
    "tags": [
        "Python",
        "Docker",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine maintains an internal cache to stage read pages and uncommitted updates. When concurrent writes generate dirty data faster than background eviction workers can flush pages to disk, cache pressure escalates rapidly.</p><p>When dirty cache usage exceeds 20% (or total usage crosses 95%), WiredTiger halts background-only eviction and forces application client threads to perform in-thread evictions. Under heavy updates, worker threads become blocked contending on tree page latch locks while writing to storage, starving the eviction threads and causing application-level timeouts that resemble distributed deadlocks.</p>",
    "root_cause": "Dirty page generation exceeds WiredTiger background eviction capacity, forcing client threads into synchronous in-thread page reconciliation that creates cascading lock contention.",
    "bad_code": "from pymongo import MongoClient, UpdateOne\nimport concurrent.futures\n\nclient = MongoClient(\"mongodb://localhost:27017/?maxPoolSize=200\")\ndb = client[\"analytics\"]\n\ndef worker(batch):\n    # Flooding WiredTiger with massive unthrottled updates triggers in-thread evictions\n    ops = [UpdateOne({\"_id\": doc[\"id\"]}, {\"$set\": doc}, upsert=True) for doc in batch]\n    db.events.bulk_write(ops, ordered=False)\n\nwith concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:\n    for chunk in large_data_generator():\n        executor.submit(worker, chunk)",
    "solution_desc": "Tune WiredTiger eviction worker thread bounds and dirty cache triggers via wiredTigerEngineRuntimeConfig. Concurrently, rate-limit application write operations and leverage chunked bulk writes with backoff to prevent client threads from being hijacked for eviction.",
    "good_code": "from pymongo import MongoClient, UpdateOne\nimport time\n\nclient = MongoClient(\"mongodb://localhost:27017/?maxPoolSize=50\")\ndb = client[\"analytics\"]\n\n# Tune WiredTiger runtime parameters to make eviction more aggressive earlier\ndb.admin.command(\n    \"setParameter\", 1,\n    wiredTigerEngineRuntimeConfig=\"eviction=(threads_min=4,threads_max=12),eviction_dirty_target=5,eviction_dirty_trigger=15\"\n)\n\ndef throttled_worker(batch):\n    ops = [UpdateOne({\"_id\": doc[\"id\"]}, {\"$set\": doc}, upsert=True) for doc in batch]\n    db.events.bulk_write(ops, ordered=False)\n    # Throttle client threads to stay below disk write saturation\n    time.sleep(0.01)\n\nfor chunk in chunked_data_generator(size=500):\n    throttled_worker(chunk)",
    "verification": "Run 'db.serverStatus().wiredTiger.cache' and inspect 'pages walked for eviction' alongside 'client calls to page eviction'. Ensure client calls to page eviction stay at 0.",
    "date": "2026-10-24",
    "id": 1792809357,
    "type": "error"
});