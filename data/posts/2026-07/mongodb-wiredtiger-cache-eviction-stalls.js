window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "WiredTiger Cache Eviction & Ticket Exhaustion",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under extreme write-heavy workloads, MongoDB's WiredTiger storage engine can experience severe throughput degradation. As data is written, it accumulates in the WiredTiger cache as dirty pages. If the rate of incoming writes exceeds the background thread eviction capability, the dirty cache ratio rises above critical thresholds. Once it hits the high-water mark (typically 20%), WiredTiger forces client threads to execute synchronous page evictions, leading to write ticket exhaustion, massive lock contention, and connection pileups.</p>",
    "root_cause": "The imbalance between disk I/O capabilities and write throughput causes dirty pages to aggregate rapidly. When dirty cache reaches the synchronous eviction limit, MongoDB switches from non-blocking background thread eviction to blocking, synchronous application-thread eviction. This monopolizes client threads, delaying transactions and consuming all available read/write tickets (defaulting to 128), locking up the server.",
    "bad_code": "// Running with default configurations under sustained high-throughput write spikes\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineConfiguration: \"cache_size=4G\"\n  // Missing eviction parameter tuning, relying on default high-water marks\n})",
    "solution_desc": "Configure and tune WiredTiger's proactive eviction parameters to start background eviction sooner, prevent dirty cache spikes from hitting the 20% limit, and scale up the eviction worker threads. Additionally, configure client write concerns and throttling mechanisms to manage throughput surges.",
    "good_code": "// Configure aggressive proactive eviction thresholds via admin command\ndb.adminCommand({\n  setParameter: 1,\n  wiredTigerConcurrentWriteTransactions: 256, // Safely scale transactions if hardware allows\n  // Force background eviction to start earlier (defaults are 80% total / 20% dirty)\n  \"wiredTiger.eviction_dirty_trigger\": 5,     // Start aggressive eviction at 5% dirty cache\n  \"wiredTiger.eviction_dirty_target\": 2,      // Target to reduce dirty cache down to 2%\n  \"wiredTiger.eviction_workers_max\": 16       // Increase background eviction threads (default is 4)\n})",
    "verification": "Run `db.serverStatus().wiredTiger.cache` to verify that the 'tracked dirty bytes in the cache' does not consistently exceed 5%. Inspect `db.serverStatus().wiredTiger.concurrentTransactions` to ensure write tickets are not depleted or queuing.",
    "date": "2026-07-01",
    "id": 1782889559,
    "type": "error"
});