window.onPostDataLoaded({
    "title": "Debug MongoDB WiredTiger Write Amplification Spikes",
    "slug": "mongodb-wiredtiger-write-amplification-fix",
    "language": "MongoDB",
    "code": "WriteAmpSpike",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses a copy-on-write mechanism for snapshots. Write amplification spikes occur when the eviction policy is forced to flush 'dirty' pages to disk prematurely because the cache pressure exceeds the configured threshold. If your workload involves small, frequent updates to disparate documents, WiredTiger may write entire 32KB pages for a few bytes of change, saturating I/O bandwidth and causing significant performance degradation during checkpoints.</p>",
    "root_cause": "The eviction_trigger threshold is reached too quickly, forcing aggressive background flushing of dirty pages to maintain cache availability.",
    "bad_code": "# Default configuration often lacks tuning for high-write workloads\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 4",
    "solution_desc": "Tune the WiredTiger eviction parameters to allow more granular background eviction and increase the 'eviction_target' to start clearing the cache earlier, preventing the 'spike' when the 'trigger' is hit.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=80,eviction_target=70,eviction_dirty_trigger=10,eviction_dirty_target=5\"\n});",
    "verification": "Monitor 'wiredTiger.cache.tracked dirty bytes in the cache' and 'I/O Wait' metrics using mongostat.",
    "date": "2026-03-25",
    "id": 1774431852,
    "type": "error"
});