window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "WiredTigerCacheStall",
    "tags": [
        "Docker",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained heavy write operations, MongoDB's storage engine, WiredTiger, stores written dirty data in memory before flushing it to disk. Eviction threads constantly work in the background to keep the volume of dirty pages below a set threshold.</p><p>When write volumes dramatically exceed disk write bandwidth, the percentage of dirty pages in the cache quickly crosses critical limits (typically 20%). When this happens, WiredTiger transitions to an aggressive in-line eviction mode, forcing application/client threads to pause processing and assist with eviction. This results in devastating performance stalls and API timeouts.</p>",
    "root_cause": "The default MongoDB WiredTiger parameters are optimized for balanced workloads. Under high-throughput continuous writes, the eviction workers cannot keep pace with incoming writes, and the target configuration parameters do not trigger proactive eviction early enough.",
    "bad_code": "# Default / Unoptimized MongoDB docker-compose or config entry\nversion: '3.8'\nservices:\nmongodb:\n  image: mongo:6.0\n  command: --wiredTigerCacheSizeGB 4\n  ports:\n    - \"27017:27017\"\n  # Lacks tuning for background eviction threads and triggers",
    "solution_desc": "Configure MongoDB with optimized WiredTiger parameters. Specifically, decrease the 'eviction_dirty_trigger' and 'eviction_dirty_target' values to start cache eviction much earlier. Additionally, increase the allocation of worker threads to ensure dirty data is cleared in the background before user write threads are stalled.",
    "good_code": "version: '3.8'\nservices:\n  mongodb:\n    image: mongo:6.0\n    command: >\n      --wiredTigerCacheSizeGB 8\n      --setParameter wiredTigerEngineRuntimeConfig=\"\n        eviction_workers_min=4,\n        eviction_workers_max=12,\n        eviction_dirty_trigger=10,\n        eviction_dirty_target=5\n      \"\n    ports:\n      - \"27017:27017\"\n    volumes:\n      - mongo-data:/data/db\n\nvolumes:\n  mongo-data:",
    "verification": "Generate a heavy write workload using tools like 'sysbench' or 'YCSB'. Run the database diagnostic command: 'db.serverStatus().wiredTiger.cache'. Verify that the 'tracked dirty bytes in the cache' metric stays stably below 10%, confirming active proactive background eviction.",
    "date": "2026-06-04",
    "id": 1780557460,
    "type": "error"
});