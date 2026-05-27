window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls & Ticket Exhaustion",
    "slug": "fixing-wiredtiger-eviction-stalls-ticket-exhaustion",
    "language": "MongoDB / Go",
    "code": "WiredTiger Cache Eviction Stall",
    "tags": [
        "Docker",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained write-heavy workloads, MongoDB instances frequently experience high response latencies or complete pauses. This state is marked by <code>wiredTigerConcurrentTransactions</code> exhaustion and high queue sizes in driver connection pools. The underlying bottleneck resides in the WiredTiger storage engine's cache management: when the rate of inbound modifications outpaces the background eviction threads, the database engine is forced to recruit client operations to perform in-page eviction.</p><p>When this happens, client threads that are supposed to execute fast writes or reads are instead blocked on memory reclamation. Because these client threads are stuck performing I/O bound eviction work, they continue to hold transactional locks and execution tickets. This causes the pool of 128 (default) read/write execution tickets to completely exhaust, bringing the entire cluster's throughput to a near standstill.</p>",
    "root_cause": "The default background eviction settings are too passive. When dirty data in the WiredTiger cache exceeds the 20% default threshold, client threads are dynamically forced into 'synchronous' eviction mode. Concurrently, ticket allocation becomes saturated because slow I/O delays transaction termination.",
    "bad_code": "# Default mongod.conf configuration with unoptimized WiredTiger engine settings\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Under 95% write load, background thread defaults fall behind\n# client threads are recruited for eviction, exhausting all 128 transaction tickets.",
    "solution_desc": "Configure the WiredTiger cache eviction parameters to trigger background eviction much earlier and more aggressively. By adjusting the eviction thresholds downwards, we ensure background threads start writing dirty data to disk before client threads are forced to assist. Additionally, scale the background eviction thread pool and selectively adjust transaction tickets to align with your storage subsystem's IOPS capacity.",
    "good_code": "# Optimized mongod.conf with aggressive eviction and increased target limits\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction_trigger=80,eviction_target=70,eviction_dirty_trigger=5,eviction_dirty_target=3,eviction_threads_min=4,eviction_threads_max=12,wiredTigerConcurrentTransactions=256\"",
    "verification": "Connect to your MongoDB shell and execute `db.serverStatus().wiredTiger.cache` to verify that dirty cache percentage remains stable below 5% under load. Check `db.serverStatus().wiredTiger.concurrentTransactions` to ensure write ticket queues stay close to zero without spikes.",
    "date": "2026-05-27",
    "id": 1779883929,
    "type": "error"
});