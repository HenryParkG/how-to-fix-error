window.onPostDataLoaded({
    "title": "Redis: Mitigating CoW Memory Bloat during RDB Snapshots",
    "slug": "redis-cow-memory-bloat-fix",
    "language": "Redis",
    "code": "OutOfMemory",
    "tags": [
        "Infra",
        "SQL",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses the <code>fork()</code> system call to create a background process for RDB snapshots. Linux utilizes Copy-on-Write (CoW) to share memory between the parent and child. However, if the application has a high write throughput during the snapshot, many memory pages are duplicated. If Transparent Huge Pages (THP) is enabled, even a small 1-byte write can cause a 2MB page to be copied, leading to massive memory spikes and OOM kills.</p>",
    "root_cause": "Transparent Huge Pages (THP) forcing 2MB page copies during fork-based background persistence, combined with high frequency key updates.",
    "bad_code": "# System setting often enabled by default\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and ensure <code>vm.overcommit_memory</code> is set to 1 to allow the kernel to allocate the virtual memory required for the fork.",
    "good_code": "# Disable THP\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n# Set overcommit memory\nsysctl vm.overcommit_memory=1\n# In redis.conf\nmaxmemory 4gb\nmaxmemory-policy allkeys-lru",
    "verification": "Check `BGSAVE` logs in Redis and monitor 'mem_fragmentation_ratio' and system memory usage during the snapshot process to ensure it stays within safe bounds.",
    "date": "2026-04-28",
    "id": 1777363716,
    "type": "error"
});