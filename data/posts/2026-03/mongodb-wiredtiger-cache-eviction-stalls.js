window.onPostDataLoaded({
    "title": "Mitigating WiredTiger Cache Eviction Stalls in MongoDB",
    "slug": "mongodb-wiredtiger-cache-eviction-stalls",
    "language": "SQL",
    "code": "Latency Spike",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput write scenarios, MongoDB's WiredTiger storage engine manages a cache for data pages. If the percentage of 'dirty' (modified) pages in the cache exceeds the <code>eviction_trigger</code> (default 20%), WiredTiger forces application threads to participate in page eviction. This leads to massive latency spikes as the threads meant for processing queries are hijacked to perform disk I/O, creating a 'stall' effect where throughput drops to near zero.</p>",
    "root_cause": "The rate of data modification exceeds the background eviction threads' ability to persist data to disk, hitting the dirty page threshold.",
    "bad_code": "# Default configuration in mongod.conf\nstorage:\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: 16",
    "solution_desc": "Adjust the WiredTiger configuration to increase the number of worker threads and lower the 'eviction_trigger' and 'eviction_target' to start background eviction earlier, preventing application threads from being hijacked.",
    "good_code": "db.adminCommand({\n  setParameter: 1,\n  \"wiredTigerEngineRuntimeConfig\": \"eviction_trigger=10,eviction_target=5,eviction_workers_min=4,eviction_workers_max=8\"\n})",
    "verification": "Monitor the 'WiredTiger cache:percentage of dirty pages' metric in mongostat; it should remain stable below the trigger threshold.",
    "date": "2026-03-02",
    "id": 1772414119,
    "type": "error"
});