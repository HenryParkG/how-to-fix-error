window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "WT_CACHE_FULL / Latency Spikes",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a cache to manage data pages. Under heavy write pressure, dirty pages (modified data not yet written to disk) accumulate. If the percentage of dirty pages exceeds the 'eviction_dirty_trigger', application threads are forced to participate in eviction, causing 'stalls' and massive latency spikes.</p><p>This creates a death spiral where the database stops processing requests because all worker threads are busy trying to clear space in the cache, while the underlying I/O subsystem is saturated.</p>",
    "root_cause": "The default eviction settings are too conservative for high-throughput SSDs, allowing dirty pages to reach critical thresholds before aggressive eviction starts.",
    "bad_code": "# Default settings often fail on high-write workloads\n# No explicit cache tuning in mongod.conf",
    "solution_desc": "Aggressively lower the dirty page triggers so that eviction threads start working earlier, and increase the number of eviction worker threads to match the CPU/IO capabilities.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=70,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=10,eviction_workers_min=4,eviction_workers_max=12\"\n})",
    "verification": "Check 'db.serverStatus().wiredTiger.cache' for 'tracked dirty pages in the cache'. The value should stay consistently below the 'eviction_dirty_trigger' percentage.",
    "date": "2026-03-30",
    "id": 1774834102,
    "type": "error"
});