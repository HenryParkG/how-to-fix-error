window.onPostDataLoaded({
    "title": "Mitigating Redis CoW Memory Spikes during BGSAVE",
    "slug": "redis-cow-memory-spikes-bgsave",
    "language": "Redis",
    "code": "OOMKiller",
    "tags": [
        "SQL",
        "Infra",
        "Redis",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses <code>fork()</code> to create a child process for <code>BGSAVE</code> operations. Linux employs a Copy-on-Write (CoW) mechanism where the child shares the parent's memory pages. However, any write to the parent during this window forces the OS to duplicate the affected memory page. In write-heavy environments, this can double the memory footprint instantly, triggering the OOM killer.</p>",
    "root_cause": "High write throughput during snapshotting combined with Transparent Huge Pages (THP) which forces 2MB page copies instead of 4KB.",
    "bad_code": "# Default Linux settings often lead to spikes\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the OS level to reduce the CoW granularity and increase the <code>overcommit_memory</code> setting to allow the kernel to handle the fork allocation more gracefully.",
    "good_code": "# Disable THP and set overcommit\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1",
    "verification": "Check 'mem_fragmentation_ratio' and 'latest_fork_usec' in Redis INFO command during a BGSAVE run to verify reduced memory growth.",
    "date": "2026-03-08",
    "id": 1772951544,
    "type": "error"
});