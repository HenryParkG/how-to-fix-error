window.onPostDataLoaded({
    "title": "Fix MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "fix-mongodb-wiredtiger-cache-eviction-stalls",
    "language": "Go",
    "code": "Database Write Stall",
    "tags": [
        "Go",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Under sustained write-heavy workloads, MongoDB can experience sudden, multi-second response latency spikes. This performance degradation occurs because the WiredTiger storage engine's background cache eviction threads cannot keep pace with incoming writes. When the percentage of dirty (unwritten) pages in the cache hits its hard ceiling (by default, 20%), WiredTiger forces client application threads to stop processing writes and assist with page eviction. This results in severe thread execution halts, causing connection pools in client applications to instantly saturate and time out.</p>",
    "root_cause": "The storage engine is configured with a cache size that is either too small or lacks proactive, lower thresholds for background thread eviction activation, forcing client write threads to block and assist in page synchronization.",
    "bad_code": "# Default or under-provisioned storage engine layout\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      # BUG: Low cache limit without tuning threshold limits leads to thread stalls under heavy load\n      cacheSizeGB: 2",
    "solution_desc": "Resize the WiredTiger cache dynamically based on available system RAM and tune the runtime engine parameters to initiate background eviction cycles proactively (e.g., triggering worker threads when dirty pages reach 5% rather than waiting for critical levels). This ensures dirty pages are constantly offloaded before user threads are blocked.",
    "good_code": "# Optimized MongoDB production settings for write-heavy profiles\nstorage:\n  dbPath: /data/db\n  journal:\n    enabled: true\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16 # Scaled properly (50% of available RAM)\nsetParameter:\n  # FIX: Tune thresholds to activate worker eviction early\n  wiredTigerEngineRuntimeConfig: \"eviction=(eviction_target=75,eviction_trigger=90,threads_min=4,threads_max=12)\"",
    "verification": "Run 'db.serverStatus().wiredTiger.cache' under synthetic load. Confirm that 'tracked dirty bytes in the cache' does not cross 10% and verify that user write operations do not flag any eviction-triggered sleep states.",
    "date": "2026-06-08",
    "id": 1780903447,
    "type": "error"
});