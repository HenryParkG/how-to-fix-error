window.onPostDataLoaded({
    "title": "Solving Redis RDB Fork-induced Latency Spikes",
    "slug": "redis-rdb-fork-latency-spikes",
    "language": "Redis",
    "code": "Fork Latency",
    "tags": [
        "Docker",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs an RDB snapshot (BGSAVE), it calls the fork() system call to create a child process. In memory-constrained container environments (like Kubernetes or Docker), the Linux kernel must duplicate the page tables. If the instance has a large memory footprint, this 'Copy-on-Write' preparation can freeze the main Redis process for several hundred milliseconds, causing significant latency spikes for clients.</p>",
    "root_cause": "High page table allocation overhead during fork() in environments where Transparent Huge Pages (THP) are enabled or memory overcommit is restricted.",
    "bad_code": "save 60 10000\n# Frequent snapshots on a 32GB RAM container\n# without proper kernel tuning.",
    "solution_desc": "Disable Transparent Huge Pages (THP), set vm.overcommit_memory to 1, and consider using AOF (Append Only File) with an incremental fsync policy to reduce the frequency of full RDB forks.",
    "good_code": "# Kernel Tuning (Host level)\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# Redis Config\nCONFIG SET save \"\"\nCONFIG SET appendonly yes\nCONFIG SET no-appendfsync-on-rewrite yes",
    "verification": "Check 'latest_fork_usec' in Redis INFO stats; values should drop from >100ms to <10ms.",
    "date": "2026-04-01",
    "id": 1775020697,
    "type": "error"
});