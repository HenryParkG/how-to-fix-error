window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "fixing-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB / C++",
    "code": "WT_CACHE_FULL Stalls",
    "tags": [
        "MongoDB",
        "WiredTiger",
        "Database",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>During high-throughput insertion or updates, MongoDB instances running the WiredTiger storage engine can experience severe write stalls and extreme latency spikes. This occurs when high-frequency B-Tree page splitting generates dirty cache pages faster than WiredTiger's background eviction worker threads can write them to disk. When dirty cache thresholds are breached, application threads are forced to perform synchronous foreground page eviction, halting normal operation processing.</p>",
    "root_cause": "Rapid B-Tree leaf page splitting produces an excessive volume of dirty pages. Once the dirty cache ratio crosses `eviction_dirty_trigger` (default 5%) or total cache utilization passes `eviction_trigger` (default 80%), application threads are hijacked for foreground cache eviction.",
    "bad_code": "# Default mongod configuration under intensive split-heavy write workloads\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default runtime settings trigger foreground eviction thread locks during heavy splits",
    "solution_desc": "Tune WiredTiger eviction worker thread counts and dirty page thresholds via runtime setParameters, adjust block allocation settings, and increase target eviction aggressiveness before foreground stalls are triggered.",
    "good_code": "# Tuned mongod.conf settings to eliminate foreground eviction stalls\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 32\nsetParameter:\n  wiredTigerConcurrentReadTransactions: 128\n  wiredTigerConcurrentWriteTransactions: 128\n  wiredTigerEngineRuntimeConfig: \"eviction_dirty_target=3,eviction_dirty_trigger=6,eviction_threads_min=8,eviction_threads_max=16\"",
    "verification": "Run `db.serverStatus().wiredtiger.cache` during stress testing and verify that 'application threads page read/write hours due to eviction' remains 0.",
    "date": "2026-08-08",
    "id": 1786181468,
    "type": "error"
});