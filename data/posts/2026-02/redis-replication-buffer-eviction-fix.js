window.onPostDataLoaded({
    "title": "Redis Replication: Fixing Client Buffer Eviction Loops",
    "slug": "redis-replication-buffer-eviction-fix",
    "language": "Redis",
    "code": "Sync Failure",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Redis Master-Slave replication involves a synchronization phase where the Master sends a bulk RDB file followed by a stream of write commands stored in the replication buffer. If the Master receives high write volume during this sync, the replication buffer (a subset of the Client Output Buffer) can exceed its hard limit.</p><p>When this happens, Redis terminates the connection to the slave. The slave reconnects, triggers a full resync, and the cycle repeats indefinitely, consuming CPU and IO while never completing the sync.</p>",
    "root_cause": "The 'client-output-buffer-limit slave' threshold is too low to accommodate the 'write delta' accumulated during the initial RDB transfer.",
    "bad_code": "# Default settings often too small for high-throughput\nclient-output-buffer-limit slave 256mb 64mb 60",
    "solution_desc": "Increase the 'client-output-buffer-limit slave' settings. Adjust the hard limit (immediate disconnect) and soft limit (disconnect after N seconds) to account for your maximum expected write throughput during the time it takes to transfer an RDB file.",
    "good_code": "# Increase hard limit to 1GB and soft limit to 512MB for 120s\nCONFIG SET client-output-buffer-limit \"slave 1024mb 512mb 120\"\n\n# Also check repl-backlog-size for partial resyncs\nCONFIG SET repl-backlog-size 256mb",
    "verification": "Check Redis logs for 'Client id=... scheduled to be closed ASAP for overcoming of output buffer limits'. If the message disappears and 'synchronized with master' appears, the fix is successful.",
    "date": "2026-02-14",
    "id": 1771031663,
    "type": "error"
});