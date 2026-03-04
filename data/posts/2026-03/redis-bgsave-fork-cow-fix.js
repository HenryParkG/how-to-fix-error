window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE Fork Failures and CoW Spikes",
    "slug": "redis-bgsave-fork-cow-fix",
    "language": "Go",
    "code": "OOM-Fork-Fail",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses the fork() system call to perform background persistence (BGSAVE). This relies on Copy-on-Write (CoW). If the OS has 'overcommit_memory' disabled or if the write throughput is high during the fork, the memory footprint can effectively double. In memory-constrained environments like Docker or Kubernetes, this triggers the OOM killer or causes the fork to fail with ENOMEM.</p>",
    "root_cause": "The kernel's strict memory overcommit policy combined with high page-modification rates during the background saving process.",
    "bad_code": "# Default Linux settings often cause this\n$ sysctl vm.overcommit_memory=0\n# Redis Log:\n# Can't save in background: fork: Cannot allocate memory",
    "solution_desc": "Set the kernel parameter vm.overcommit_memory to 1 to allow the fork to succeed regardless of the current allocation. Additionally, disable Transparent Huge Pages (THP), as they significantly increase CoW overhead by forcing 2MB page copies instead of 4KB.",
    "good_code": "# Apply to the host machine\necho 1 > /proc/sys/vm/overcommit_memory\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Redis Config optimization\nCONFIG SET stop-writes-on-bgsave-error no",
    "verification": "Monitor 'redis_mem_fragmentation_ratio' and kernel logs during BGSAVE using 'sar -B' to observe fault rates.",
    "date": "2026-03-04",
    "id": 1772606170,
    "type": "error"
});