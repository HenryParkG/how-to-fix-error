window.onPostDataLoaded({
    "title": "Tuning WiredTiger Cache Eviction Starvation",
    "slug": "mongodb-wiredtiger-cache-eviction-starvation",
    "language": "MongoDB",
    "code": "Eviction Starvation",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>WiredTiger uses an in-memory cache to manage read and write operations. Under heavy write concurrency, the rate at which dirty data is generated can outpace the background thread eviction rate. When the dirty data threshold crosses configured limits, client application threads are hijacked to perform synchronous page write-outs to disk. This causes severe latency spikes and throughput degradation, known as cache eviction starvation.</p>",
    "root_cause": "The rate of incoming dirty writes exceeds the background eviction thread capacity, causing the cache to exceed the hard limit where client threads are forced to perform write-stalls.",
    "bad_code": "db.runCommand({\n  // Default settings might allow high write concurrency to saturate\n  // the cache before aggressive background eviction kicks in.\n})",
    "solution_desc": "Proactively configure WiredTiger background eviction parameters to start earlier, and configure more aggressive eviction threads to prevent the dirty cache ratio from triggering application thread blocking.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  wiredTigerEngineRuntimeConfig: \"eviction_target=75,eviction_trigger=90,eviction_workers_max=8,eviction_workers_min=4\"\n})",
    "verification": "Monitor database performance using `db.serverStatus().wiredTiger.cache`. Check specifically for non-zero values of 'tracked dirty bytes in the cache' nearing the trigger threshold and verify that 'eviction calls to get a page' are handled by background workers rather than user threads.",
    "date": "2026-07-08",
    "id": 1783489445,
    "type": "error"
});