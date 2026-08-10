window.onPostDataLoaded({
    "title": "Fixing MongoDB WiredTiger Cache Eviction Stalls in Writes",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls-write-bursts",
    "language": "SQL",
    "code": "WIREDTIGER_CACHE_STALL",
    "tags": [
        "SQL",
        "Docker",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>During sustained high-throughput bulk write operations, MongoDB clusters suffer severe latency degradation where write operations freeze for several seconds. Monitoring indicates that the WiredTiger cache dirty bytes ratio exceeds 20%, forcing active application threads to participate directly in page eviction rather than processing incoming queries.</p><p>This page-eviction stall causes client-side connection pool saturation, cascading timeouts, and database engine lockup when dirty data production rate drastically outpaces background eviction worker threads.</p>",
    "root_cause": "Default WiredTiger eviction threshold parameters allow write bursts to saturate cache dirty bytes above 20% (eviction_dirty_trigger), shifting memory cleanup responsibilities from background eviction threads directly to user application request threads.",
    "bad_code": "# mongod.conf default configuration under severe write pressure\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 8\n      # Default eviction limits leave no headroom for bursts:\n      # eviction_dirty_target: 5%\n      # eviction_dirty_trigger: 20% (causes application thread stalls)",
    "solution_desc": "Tune eviction_dirty_target and eviction_dirty_trigger lower while increasing eviction_threads_max in WiredTiger engine parameters so background eviction starts earlier and more aggressively before user threads get hijacked.",
    "good_code": "# Optimized mongod.conf for high write throughput\nstorage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction_dirty_target=3,eviction_dirty_trigger=10,eviction_threads_min=4,eviction_threads_max=12\"",
    "verification": "Execute db.serverStatus().wiredtiger.cache during high burst ingestion and confirm tracked dirty bytes in the cache stays below 10%, with zero application-level eviction stall warnings in mongod.log.",
    "date": "2026-08-10",
    "id": 1786345865,
    "type": "error"
});