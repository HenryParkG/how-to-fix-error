window.onPostDataLoaded({
    "title": "Redis: Mitigating CoW Memory Spikes During Snapshots",
    "slug": "redis-mitigating-cow-memory-spikes",
    "language": "Redis",
    "code": "OOM-Killer Spike",
    "tags": [
        "Docker",
        "AWS",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs a BGSAVE or BGREWRITEAOF, it forks a child process. Linux utilizes Copy-on-Write (CoW) to share memory pages. However, if the parent process receives high-frequency write commands during this period, Linux must duplicate the modified pages. In write-heavy environments, this can lead to memory usage doubling instantly, triggering the OOM killer.</p>",
    "root_cause": "The combination of Linux Transparent Huge Pages (THP) and high write throughput during a fork() operation increases the granularity and frequency of page copies.",
    "bad_code": "# Default Linux Config often causes this\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n# Redis config without memory overhead planning\nmaxmemory 4gb # On an 8gb machine with high writes",
    "solution_desc": "Disable Transparent Huge Pages (THP) on the host OS to reduce the CoW copy size from 2MB to 4KB. Additionally, set `maxmemory` to ~60-70% of total RAM to provide a buffer for the fork overhead.",
    "good_code": "# Disable THP at the OS level\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n# In redis.conf, use a conservative maxmemory\nmaxmemory 5368709120 # 5GB for an 8GB RAM node",
    "verification": "Check 'mem_fragmentation_ratio' during a BGSAVE and monitor dmesg for OOM killer events.",
    "date": "2026-03-23",
    "id": 1774259719,
    "type": "error"
});