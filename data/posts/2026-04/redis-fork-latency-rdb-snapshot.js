window.onPostDataLoaded({
    "title": "Mitigating Redis Fork-Induced Latency Spikes",
    "slug": "redis-fork-latency-rdb-snapshot",
    "language": "Node.js",
    "code": "Latency Spike",
    "tags": [
        "Infra",
        "AWS",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses the <code>fork()</code> system call to create a child process for RDB snapshotting. While this uses Copy-on-Write (CoW), the parent process must still copy the page table. On large instances (e.g., 64GB+), this fork can take hundreds of milliseconds. Furthermore, if 'Transparent Huge Pages' (THP) is enabled in the Linux kernel, the CoW mechanism becomes extremely aggressive, copying 2MB pages instead of 4KB pages, causing massive latency spikes during writes.</p>",
    "root_cause": "High memory page table management overhead during fork() combined with Transparent Huge Pages (THP) increasing the memory pressure during write operations.",
    "bad_code": "# Current Kernel Config causing spikes\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the OS level, set `vm.overcommit_memory = 1`, and ensure `latency-monitor-threshold` is configured in Redis to identify slow events. For extreme cases, move to a diskless replication strategy or use AWS ElastiCache with 'Enhanced IO'.",
    "good_code": "# Permanent fix via sysctl and kernel tuning\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\nredis-cli CONFIG SET latency-monitor-threshold 100",
    "verification": "Execute `redis-cli --latency` or check `INFO commandstats` to verify that the `fork` time and `sub_process_total_latency` are within acceptable sub-millisecond ranges.",
    "date": "2026-04-21",
    "id": 1776735965,
    "type": "error"
});