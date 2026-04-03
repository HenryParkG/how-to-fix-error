window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-stalls",
    "language": "AWS",
    "code": "WiredTigerCacheEvictionStall",
    "tags": [
        "AWS",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB write-heavy workloads often experience sudden spikes in latency when the WiredTiger cache fills up with dirty pages. When the 'dirty' percentage exceeds the eviction threshold, WiredTiger threads start performing application-side eviction, essentially blocking client operations until the cache is cleared. This results in a 'sawtooth' performance pattern where throughput drops to near zero for several seconds.</p>",
    "root_cause": "Default eviction settings (5% dirty trigger) are too conservative for high-throughput SSDs (like AWS EBS gp3/io2), causing the cache to fill faster than the background threads can flush it.",
    "bad_code": "storage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default internal settings: \n# eviction_dirty_target: 5%, eviction_dirty_trigger: 20%",
    "solution_desc": "Tune the WiredTiger engine configuration to trigger background eviction earlier and increase the number of worker threads to match the available I/O bandwidth.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=8),eviction_dirty_target=3,eviction_dirty_trigger=10\"\n})\n# Or in mongod.conf:\n# wiredTiger.engineConfig.configString: \"eviction=(threads_min=4,threads_max=8)\"",
    "verification": "Check `db.serverStatus().wiredTiger.cache['tracked dirty bytes in the cache']` and ensure it stays below the trigger threshold.",
    "date": "2026-04-03",
    "id": 1775209533,
    "type": "error"
});