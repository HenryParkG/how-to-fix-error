window.onPostDataLoaded({
    "title": "Mitigating Redis CoW Memory Bloat in RDB",
    "slug": "redis-cow-memory-bloat-fix",
    "language": "Go",
    "code": "OOMKiller",
    "tags": [
        "Docker",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background save (BGSAVE), it forks a child process. Linux uses Copy-on-Write (CoW) to manage memory. However, if 'Transparent Huge Pages' (THP) is enabled, the kernel copies 2MB chunks instead of 4KB pages even for tiny writes. This leads to massive memory amplification during the snapshotting period, often triggering the OOM Killer.</p>",
    "root_cause": "Transparent Huge Pages (THP) causing excessive memory duplication during the fork-based RDB snapshotting process.",
    "bad_code": "# Current system state often defaults to:\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and ensure 'overcommit_memory' is set to 1 to allow the fork to succeed without over-allocating physical RAM.",
    "good_code": "echo never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\nsysctl vm.overcommit_memory=1",
    "verification": "Compare the 'mem_fragmentation_ratio' and 'used_memory_peak' during RDB snapshots before and after the change.",
    "date": "2026-02-20",
    "id": 1771550071,
    "type": "error"
});