window.onPostDataLoaded({
    "title": "Fixing WiredTiger Cache Eviction Stalls",
    "slug": "fixing-wiredtiger-cache-eviction-stalls",
    "language": "MongoDB",
    "code": "WT_CACHE_FULL",
    "tags": [
        "Docker",
        "Kubernetes",
        "MongoDB",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained write-heavy workloads, MongoDB's default storage engine, WiredTiger, can experience severe write stalls. This issue arises when the rate of incoming dirty data exceeds the background thread eviction rate. When total dirty data in the WiredTiger cache reaches 20% (or total cache occupancy passes 95%), application threads are hijacked to perform synchronous page eviction. This results in latency spikes, connection pool exhaustion, and cascading microservice failures.</p><p>By tuning WiredTiger's internal thread scaling and adjusting clean/dirty eviction targets, we can force early, aggressive asynchronous eviction, ensuring that client threads never block to clear memory pages.</p>",
    "root_cause": "The default WiredTiger parameters do not dynamically scale eviction threads fast enough on high-throughput NVMe SSDs, triggering synchronous client-thread page eviction when the dirty cache threshold exceeds 20%.",
    "bad_code": "# Default mongod.conf settings (implicitly uses standard WiredTiger parameters)\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Lacks specific thread tuning under heavy concurrent write loads",
    "solution_desc": "Configure explicit, aggressive WiredTiger engine parameters using the 'wiredTigerEngineConfigString'. Increase the maximum number of eviction threads, lower the dirty trigger threshold from 20% to 5%, and decrease the dirty target threshold to 3% to initiate background eviction much sooner.",
    "good_code": "# Optimized mongod.conf configuration for high-write workloads\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16\n      configString: \"eviction=(threads_min=4,threads_max=20),eviction_dirty_trigger=5,eviction_dirty_target=3,eviction_trigger=90,eviction_target=80\"",
    "verification": "Execute 'db.serverStatus().wiredTiger.cache' during high-load tests and verify that the metric 'pages evicted by connection workers' remains at 0, while 'pages evicted by eviction workers' scales up smoothly.",
    "date": "2026-05-25",
    "id": 1779692639,
    "type": "error"
});