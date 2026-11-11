window.onPostDataLoaded({
    "title": "Redis BGSAVE Fork Latency & COW Memory Exhaustion",
    "slug": "redis-bgsave-cow-memory-exhaustion-fork-latency",
    "language": "Redis",
    "code": "OOM Command / Latency Spike",
    "tags": [
        "Redis",
        "Memory",
        "Linux",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis executes snapshotting via <code>BGSAVE</code> or background AOF rewrites (<code>BGREWRITEAOF</code>), it invokes the Linux system call <code>fork()</code>. During <code>fork()</code>, the kernel duplicates page table references for the entire process memory space. On large instances (e.g., &gt;20GB), the time required to copy page tables freezes Redis's single-threaded event loop, leading to clients encountering connection timeouts.</p><p>Furthermore, under active write traffic, the Linux kernel allocates physical pages via Copy-On-Write (COW). If Transparent Huge Pages (THP) is active, writing a single 64-byte key causes the kernel to allocate a full 2MB huge page instead of standard 4KB pages, causing the overall RSS memory footprint to spike rapidly and triggering the Linux Out-Of-Memory (OOM) killer.</p>",
    "root_cause": "Linux kernel page table duplication overhead blocking the single-threaded event loop during `fork()`, exacerbated by Transparent Huge Pages (THP) multiplying memory overhead during Copy-On-Write cycles under heavy write mutation.",
    "bad_code": "# Default / insecure Redis host config under heavy writes\n# redis.conf\nsave 60 10000\nappendonly yes\nappendfsync everysec\nauto-aof-rewrite-percentage 100\n\n# System settings left at defaults\n# /sys/kernel/mm/transparent_hugepage/enabled -> [always] madvise never\n# /proc/sys/vm/overcommit_memory -> 0",
    "solution_desc": "Disable Transparent Huge Pages across the operating system, configure `vm.overcommit_memory = 1` to prevent `fork()` failures, shard data across smaller multi-instance processes (&lt;10GB each) to minimize page table size, and offload snapshot persistence exclusively to non-serving read replicas.",
    "good_code": "# 1. OS-level remediation via sysctl and kernel tunables\n# Add to /etc/sysctl.d/99-redis.conf:\nvm.overcommit_memory = 1\n\n# Run via systemd / rc.local:\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# 2. Redis Primary Configuration (redis.conf - disable snapshotting on writer)\nsave \"\"\nappendonly no\n\n# 3. Redis Replica Configuration (dedicated replica for backups)\nreplicaof 10.0.0.1 6379\nappendonly yes\nappendfsync everysec\nno-appendfsync-on-rewrite yes\nauto-aof-rewrite-percentage 100\nauto-aof-rewrite-min-size 64mb",
    "verification": "Query `INFO persistence` and monitor `latest_fork_usec` and `mem_cow_size`. Ensure `latest_fork_usec` remains under 10,000 microseconds and monitor memory limits using `docker stats` or `vmstat 1` during automated backups.",
    "date": "2026-11-11",
    "id": 1794403679,
    "type": "error"
});