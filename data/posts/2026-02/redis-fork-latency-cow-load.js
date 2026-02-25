window.onPostDataLoaded({
    "title": "Mitigating Redis Fork-Induced Latency Spikes",
    "slug": "redis-fork-latency-cow-load",
    "language": "SQL",
    "code": "OOM / LATENCY",
    "tags": [
        "SQL",
        "Redis",
        "Linux",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis relies on the <code>fork()</code> system call to perform background persistence (RDB snapshots or AOF rewrites). In environments with massive datasets and high write throughput, the Copy-on-Write (CoW) mechanism triggers significant performance degradation. When the child process is created, the kernel marks memory pages as read-only. Every subsequent write by the parent process triggers a page fault and a physical page copy. On Linux, if Transparent Huge Pages (THP) are enabled, the kernel attempts to copy 2MB pages instead of 4KB, leading to massive stalls in the parent process and increased memory pressure.</p>",
    "root_cause": "Transparent Huge Pages (THP) create a high-latency overhead during Copy-on-Write page faults during a Redis BGSAVE, causing the parent process to block for several milliseconds per write.",
    "bad_code": "# Default System Config (Check via terminal)\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n# Redis Config\nsave 900 1\nsave 300 10",
    "solution_desc": "Disable Transparent Huge Pages at the OS level to reduce CoW overhead. Additionally, tune the `active-defrag-cycle` and ensure `vm.overcommit_memory` is set to 1. If persistence is the bottleneck, consider using diskless replication or offloading snapshots to a secondary replica to avoid forking on the primary master.",
    "good_code": "# Disable THP immediately\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Persist in /etc/rc.local or sysctl\n# Update redis.conf\nlatency-monitor-threshold 100\nstop-writes-on-bgsave-error no",
    "verification": "Monitor 'redis-cli --intrinsic-latency 100' and 'info stats' (specifically rdb_last_bgsave_status) during a snapshot.",
    "date": "2026-02-25",
    "id": 1772002484,
    "type": "error"
});