window.onPostDataLoaded({
    "title": "Fixing Redis CoW Spikes during RDB Snapshots",
    "slug": "redis-cow-memory-spikes-rdb",
    "language": "Redis",
    "code": "Memory Fragmentation/OOM",
    "tags": [
        "Docker",
        "Infra",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Redis persistence (BGSAVE) uses the Linux fork() system call. Linux employs Copy-on-Write (CoW) to share memory between the parent and child. However, if the parent Redis process experiences high write volume during the snapshot, Linux must duplicate memory pages for every write. In worst-case scenarios with large pages (Transparent Huge Pages) enabled, a small write can trigger a 2MB page copy, rapidly exhausting system RAM and triggering the OOM killer.</p>",
    "root_cause": "High write throughput during a background snapshot combined with Transparent Huge Pages (THP) and insufficient memory overcommit settings.",
    "bad_code": "# Default Linux settings often problematic for Redis\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n# sysctl vm.overcommit_memory=0",
    "solution_desc": "Disable Transparent Huge Pages to reduce the CoW granularity and set vm.overcommit_memory to 1 to allow the fork() to succeed even if the OS thinks it might run out of memory.",
    "good_code": "# Run as root\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n# In redis.conf\nlatency-monitor-threshold 100",
    "verification": "Check Redis logs for 'RDB: X MB of memory used by copy-on-write' and ensure it is significantly lower than total RAM.",
    "date": "2026-03-10",
    "id": 1773105050,
    "type": "error"
});