window.onPostDataLoaded({
    "title": "Resolve MongoDB WiredTiger Cache Eviction Stalls",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "WiredTiger Ticket Starvation",
    "tags": [
        "SQL",
        "MongoDB",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>MongoDB's WiredTiger storage engine utilizes internal read and write tickets to throttle concurrency. Under high write loads with unoptimized memory targets, the WiredTiger cache can become filled with dirty pages faster than background threads can evict them. When dirty pages surpass the critical threshold (typically 20% of cache size), client request threads are forced to perform emergency inline eviction, causing a spiral of ticket depletion, severe read/write latency spikes, and eventual connection timeouts.</p>",
    "root_cause": "Default eviction settings allow dirty data to pile up until client threads are hijacked for inline eviction. These hijacked threads retain read/write tickets for long durations, starving incoming client connections of tickets.",
    "bad_code": "# Buggy: Starting mongod with high memory pressures and default thresholds\nmongod --dbpath /data/db --wiredTigerCacheSizeGB 4",
    "solution_desc": "Adjust WiredTiger's parameters dynamically to start eviction earlier in the background. Lowering the trigger thresholds for dirty data eviction prevents user threads from executing inline eviction tasks and guarantees tickets are returned promptly.",
    "good_code": "// Solved: Run administrative command to tune WiredTiger eviction thresholds\ndb.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_target=75,eviction_trigger=90,eviction_dirty_target=5,eviction_dirty_trigger=15\"\n});\n\n// Explanation of configured options:\n// eviction_dirty_target=5: Keep dirty data below 5% of cache (default 10%)\n// eviction_dirty_trigger=15: Start aggressive background eviction at 15% (default 20%) to avoid client thread hijacking",
    "verification": "Monitor execution patterns via mongostat. Ensure 'r/w' queue metrics remain stable and dirty cache sizes consistently hover below 15% without triggering sudden increases in active write queues.",
    "date": "2026-07-12",
    "id": 1783843259,
    "type": "error"
});