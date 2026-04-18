window.onPostDataLoaded({
    "title": "Resolving Redis BGSAVE Latency Spikes caused by THP",
    "slug": "redis-bgsave-latency-thp-fix",
    "language": "Redis",
    "code": "Redis-Latency-THP",
    "tags": [
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Transparent Huge Pages (THP) is a Linux memory management feature that reduces TLB misses by using 2MB pages. However, Redis uses <code>fork()</code> to perform background saves (BGSAVE). Because of Copy-on-Write (CoW), if THP is enabled, the kernel must copy 2MB pages even if only a few bytes change, causing massive latency spikes and memory bloat during persistence cycles.</p>",
    "root_cause": "The kernel's CoW mechanism granularity increases from 4KB to 2MB, leading to allocation delays and high memory pressure during background persistence.",
    "bad_code": "# Check THP status\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Returns: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level. This forces the kernel to use standard 4KB pages, making the Copy-on-Write process significantly more efficient for Redis's memory access patterns.",
    "good_code": "# Disable THP immediately\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# To make it permanent, add to /etc/rc.local or use a systemd unit:\n# [Service]\n# ExecStart=/bin/sh -c 'echo never > /sys/kernel/mm/transparent_hugepage/enabled'",
    "verification": "Check Redis logs for the warning: 'WARNING you have Transparent Huge Pages (THP) enabled in your kernel.' Ensure it disappears after the fix and monitor the `latest_fork_usec` metric in Redis INFO.",
    "date": "2026-04-18",
    "id": 1776475514,
    "type": "error"
});