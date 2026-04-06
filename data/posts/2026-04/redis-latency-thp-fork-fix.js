window.onPostDataLoaded({
    "title": "Mitigating Redis Latency Spikes via THP Disabling",
    "slug": "redis-latency-thp-fork-fix",
    "language": "C",
    "code": "LatencySpike",
    "tags": [
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs a background save (BGSAVE), it forks the process. If Transparent Huge Pages (THP) are enabled, the Linux kernel uses 2MB pages instead of 4KB. During the Copy-on-Write (CoW) process, modifying a single byte forces the kernel to copy an entire 2MB page, causing massive latency spikes.</p>",
    "root_cause": "Transparent Huge Pages (THP) amplification of Copy-on-Write overhead during child process forking in memory-intensive workloads.",
    "bad_code": "# Current system state check\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable THP at the OS level to force Redis to use standard 4KB pages, significantly reducing the memory pressure and CPU cycles required for CoW during snapshots.",
    "good_code": "# Disable THP immediately\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n# Ensure it persists in /etc/rc.local or via sysfsutils",
    "verification": "Monitor Redis 'latency-monitor' or 'slowlog' during BGSAVE operations to ensure spikes are under 10ms.",
    "date": "2026-04-06",
    "id": 1775438923,
    "type": "error"
});