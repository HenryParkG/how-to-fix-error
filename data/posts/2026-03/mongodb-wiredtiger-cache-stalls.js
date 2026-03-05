window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-stalls",
    "language": "C++",
    "code": "Cache Eviction Latency",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput MongoDB write workloads, the WiredTiger storage engine can experience 'eviction stalls'. This happens when the rate of incoming writes exceeds the background eviction threads' ability to free up space in the internal cache. When the cache hits 95% occupancy, WiredTiger forces application threads to perform eviction themselves, leading to massive spikes in p99 latency.</p>",
    "root_cause": "The eviction_trigger threshold is reached due to inadequate I/O throughput or misconfigured cache size relative to the write volume.",
    "bad_code": "// Default Mongod configuration on a high-core system\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Too small for 100k ops/sec",
    "solution_desc": "Tune the WiredTiger eviction parameters to start background eviction earlier and increase the number of eviction threads. This prevents application threads from being hijacked for cache maintenance.",
    "good_code": "db.adminCommand({\n    \"setParameter\": 1,\n    \"wiredTigerEngineRuntimeConfig\": \"eviction=(threads_min=4,threads_max=8),eviction_trigger=80,eviction_target=60\"\n});",
    "verification": "Monitor the 'wiredTiger.cache.tracked dirty bytes in the cache' metric via mongostat. Stalls are mitigated if 'dirty' stays below the eviction_trigger.",
    "date": "2026-03-05",
    "id": 1772673349,
    "type": "error"
});