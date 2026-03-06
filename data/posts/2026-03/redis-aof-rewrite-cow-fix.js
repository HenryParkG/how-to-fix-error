window.onPostDataLoaded({
    "title": "Mitigating Redis AOF Rewrite CoW Memory Exhaustion",
    "slug": "redis-aof-rewrite-cow-fix",
    "language": "Go",
    "code": "OOMKill",
    "tags": [
        "SQL",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses a child process to perform AOF (Append Only File) rewriting via the fork() system call. This relies on Copy-on-Write (CoW). In environments with high write throughput, every write to the parent process triggers a page copy. If the dataset is large and the write volume is high during the rewrite, memory usage can effectively double, triggering the OOM killer.</p><p>Transparent Huge Pages (THP) significantly exacerbate this issue. If THP is enabled, a single 1-byte write triggers a 2MB page copy instead of a standard 4KB page copy, leading to massive memory bloat during background persistence tasks.</p>",
    "root_cause": "The intersection of high-frequency write operations and Transparent Huge Pages (THP) causes excessive memory allocation during the fork-based AOF rewrite process.",
    "bad_code": "# Standard Redis Config often vulnerable in high-load environments\nappendonly yes\nauto-aof-rewrite-percentage 100\nauto-aof-rewrite-min-size 64mb\n# Kernel level: cat /sys/kernel/mm/transparent_hugepage/enabled -> [always]",
    "solution_desc": "Disable Transparent Huge Pages at the OS level to reduce CoW granularity. Additionally, tune Redis 'aof-rewrite-incremental-fsync' to prevent disk I/O spikes and consider increasing the 'auto-aof-rewrite-percentage' to reduce rewrite frequency during peak hours.",
    "good_code": "# 1. Disable THP via shell\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# 2. Optimize Redis Persistence Config\nappendonly yes\nno-appendfsync-on-rewrite yes\naof-rewrite-incremental-fsync yes\nauto-aof-rewrite-percentage 300\nauto-aof-rewrite-min-size 1gb",
    "verification": "Monitor 'mem_fragmentation_ratio' and system-level resident set size (RSS) during a 'BGREWRITEAOF' command using 'redis-cli info memory'.",
    "date": "2026-03-06",
    "id": 1772759971,
    "type": "error"
});