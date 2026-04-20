window.onPostDataLoaded({
    "title": "Mitigating MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-eviction-fix",
    "language": "Go",
    "code": "CacheEvictionContention",
    "tags": [
        "SQL",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In write-heavy MongoDB workloads, the WiredTiger storage engine can experience 'cache pressure.' When the percentage of dirty data in the cache exceeds the 'eviction_trigger' (default 20%), application threads are forced to participate in eviction logic. This causes massive latency spikes as the database effectively throttles writes to prevent memory exhaustion, leading to a feedback loop of slow performance.</p>",
    "root_cause": "Dirty cache accumulation exceeding eviction thresholds, forcing application threads into synchronous page eviction.",
    "bad_code": "storage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n# Default settings often fail under 50k+ write IOPS",
    "solution_desc": "Lower the eviction thresholds to start background eviction earlier. By reducing 'eviction_trigger' and 'eviction_target', WiredTiger's background threads work more aggressively, keeping the cache clean enough that application threads are never recruited for eviction.",
    "good_code": "db.adminCommand({\n  \"setParameter\": 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=10,eviction_target=5,eviction_dirty_trigger=5,eviction_dirty_target=3\"\n});",
    "verification": "Monitor 'wiredTiger.cache.tracked dirty bytes in the cache' in mongostat to ensure it stays below the trigger.",
    "date": "2026-04-20",
    "id": 1776663174,
    "type": "error"
});