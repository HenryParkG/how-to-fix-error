window.onPostDataLoaded({
    "title": "Mitigating Redis Fork Latency in Large-Memory Instances",
    "slug": "redis-fork-latency-mitigation",
    "language": "Rust",
    "code": "Tail Latency Spike (fork() overhead)",
    "tags": [
        "AWS",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis persistence mechanisms like RDB snapshots and AOF rewrites utilize the fork() system call to create a child process. On Linux, fork() is 'copy-on-write,' but the kernel must still duplicate the parent's page table entries. For instances with large memory footprints (e.g., 64GB+), this duplication process can take hundreds of milliseconds, during which the main Redis thread is blocked, causing massive spikes in tail latency (P99).</p>",
    "root_cause": "The time required to copy page tables is proportional to the memory size; Transparent Huge Pages (THP) further exacerbate this by causing massive stalls during memory re-allocation.",
    "bad_code": "# Default OS setting that kills Redis performance\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the OS level to reduce CoW overhead and switch to a 'replica-only' persistence strategy for high-traffic instances where the primary node does not perform disk I/O, or use higher-performance persistent memory.",
    "good_code": "# Disable THP permanently\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Redis Config optimization\n# redis.conf\nsave \"\" # Disable RDB on primary\nappendonly no # Disable AOF on primary, handle on replica",
    "verification": "Monitor 'latest_fork_usec' via 'redis-cli info stats'. Ensure the value stays under 50,000 microseconds for large instances.",
    "date": "2026-04-03",
    "id": 1775192471,
    "type": "error"
});