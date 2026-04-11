window.onPostDataLoaded({
    "title": "Eliminating Redis Fork Child Latency Spikes on THP",
    "slug": "redis-fork-latency-thp-fix",
    "language": "Redis / Linux",
    "code": "Latency Spike",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background save (BGSAVE) or AOF rewrite, it uses the fork() system call to create a child process. On Linux systems with Transparent Huge Pages (THP) enabled, the kernel manages memory in 2MB chunks rather than 4KB. During the Copy-on-Write (CoW) phase, if Redis modifies even a single byte within a 2MB page, the kernel is forced to copy the entire 2MB block. In high-write environments, this creates massive memory pressure and CPU stalls, leading to latency spikes that can exceed several hundred milliseconds.</p>",
    "root_cause": "The Linux kernel's Transparent Huge Pages (THP) mechanism forces 2MB page copies during Copy-on-Write (CoW) operations triggered by Redis fork() calls, causing I/O blocking.",
    "bad_code": "# Current System Status\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n# Result: High latency during BGSAVE",
    "solution_desc": "Disable Transparent Huge Pages at the OS level to force the kernel to use standard 4KB pages. This ensures that Copy-on-Write operations only duplicate small memory segments, significantly reducing the overhead during fork child execution.",
    "good_code": "# Disable THP immediately\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Persist in /etc/rc.local or via tuned-adm profile",
    "verification": "Run 'redis-cli info stats' and monitor 'latest_fork_usec'. Values should drop from >100ms to <10ms for typical datasets.",
    "date": "2026-04-11",
    "id": 1775899945,
    "type": "error"
});