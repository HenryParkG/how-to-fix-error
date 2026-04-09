window.onPostDataLoaded({
    "title": "Fixing Redis Fork-Induced Latency Spikes",
    "slug": "redis-fork-latency-large-memory",
    "language": "Redis/Go",
    "code": "LatencySpike",
    "tags": [
        "Go",
        "Infra",
        "Redis",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs a BGSAVE or BGREWRITEAOF, it calls fork() to create a child process. In instances with large memory footprints (e.g., 64GB+), the time taken to copy the page table can be significant, causing the main thread to block and latency to spike.</p><p>The issue is exacerbated by Transparent Huge Pages (THP). While THP aims to reduce TLB misses, it forces the fork() operation to copy larger memory chunks, significantly increasing the 'copy-on-write' (COW) overhead when the parent process continues to receive writes.</p>",
    "root_cause": "Large page table copy time during fork() combined with Transparent Huge Pages (THP) overhead.",
    "bad_code": "# Current system settings\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n# Redis config\nsave 900 1",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and tune the 'active-defrag' and 'maxmemory-policy' to prevent fragmentation. Consider using 'repl-diskless-sync' for replicas to avoid disk I/O contention during forks.",
    "good_code": "# Disable THP\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n# In redis.conf\nlatency-monitor-threshold 100",
    "verification": "Monitor 'redis-cli --latency' and check the 'latest_fork_usec' field in 'INFO stats' for values under 10ms.",
    "date": "2026-04-09",
    "id": 1775711073,
    "type": "error"
});