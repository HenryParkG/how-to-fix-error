window.onPostDataLoaded({
    "title": "Fixing Redis CoW Memory Bloat during Snapshots",
    "slug": "redis-cow-memory-bloat-snapshots",
    "language": "Redis",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Redis",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses <code>fork()</code> to create a point-in-time snapshot (RDB) for persistence. This relies on the OS 'Copy-on-Write' (CoW) mechanism. While child and parent share the same physical memory pages initially, any write to the parent during the snapshot forces the OS to duplicate the page. In environments with 'Transparent Huge Pages' (THP) enabled, the OS copies 2MB pages instead of 4KB, leading to massive memory usage spikes that can trigger the OOM killer.</p>",
    "root_cause": "High write volume during BGSAVE combined with Transparent Huge Pages (THP) causing excessive memory page duplication.",
    "bad_code": "# Default Linux settings often have THP enabled\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and ensure 'vm.overcommit_memory' is set to 1. This reduces the granularity of memory duplication during the fork process.",
    "good_code": "# Disable THP\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Set sysctl\nsysctl vm.overcommit_memory=1",
    "verification": "Check 'INFO Persistence' and monitor 'mem_fragmentation_ratio' and RSS during a 'BGSAVE' command.",
    "date": "2026-02-17",
    "id": 1771310899,
    "type": "error"
});