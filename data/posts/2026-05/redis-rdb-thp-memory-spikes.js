window.onPostDataLoaded({
    "title": "Eliminating Redis RDB Memory Spikes from THP Fragmentation",
    "slug": "redis-rdb-thp-memory-spikes",
    "language": "Linux / C",
    "code": "OOMCritical",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs a BGSAVE or initiates a replication handshake, it calls fork() to create a point-in-time snapshot. Under normal conditions, Linux uses Copy-on-Write (CoW) at a 4KB page granularity. However, when Transparent Huge Pages (THP) are enabled, the kernel attempts to manage memory in 2MB chunks. If Redis modifies a single byte, the kernel forces a CoW of the entire 2MB page. This causes the resident set size (RSS) to spike drastically, often leading to Out-of-Memory (OOM) kills during heavy write loads.</p>",
    "root_cause": "Transparent Huge Pages (THP) forcing 2MB Copy-on-Write operations instead of standard 4KB pages during the RDB snapshotting fork process.",
    "bad_code": "# Current system state often defaults to 'always'\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level to ensure Redis can utilize fine-grained CoW, significantly reducing the memory overhead of background persistence tasks.",
    "good_code": "# Disable THP immediately and persist in /etc/rc.local\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag",
    "verification": "Run 'redis-cli BGSAVE' during high write throughput and monitor memory usage via 'top' or 'info memory' to ensure RSS stays within 1.5x of used_memory.",
    "date": "2026-05-01",
    "id": 1777601238,
    "type": "error"
});