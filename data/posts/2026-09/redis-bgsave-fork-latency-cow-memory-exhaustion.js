window.onPostDataLoaded({
    "title": "Fix Redis BGSAVE Latency Spikes and Copy-on-Write OOM",
    "slug": "redis-bgsave-fork-latency-cow-memory-exhaustion",
    "language": "Go",
    "code": "RedisForkOOM",
    "tags": [
        "Go",
        "Kubernetes",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Redis persists in-memory datasets to disk via background snapshots triggered by the <code>BGSAVE</code> command or automatic save thresholds. To create an RDB snapshot without interrupting client operations, Redis invokes the Linux system call <code>fork()</code>. This creates a child process sharing the parent's memory pages via Copy-on-Write (CoW).</p><p>Two severe failure modes occur during this process on large memory footprints: First, the <code>fork()</code> syscall requires duplicating the parent's page tables. For a 32GB Redis instance, page tables occupy several hundred megabytes; copying them blocks the main single-threaded event loop, introducing multi-hundred-millisecond latency spikes that break application SLAs. Second, if the Redis instance processes heavy write workloads while <code>BGSAVE</code> is active, Linux allocates separate 4KB (or 2MB HugePage) physical pages for every modified key. Under write-heavy conditions, memory usage nearly doubles, triggering the Linux Out-Of-Memory (OOM) killer to terminate the Redis process.</p>",
    "root_cause": "The fork() syscall blocks the single-threaded event loop during page table allocation, while active write traffic on Transparent Huge Pages (THP) rapidly inflates Copy-on-Write memory consumption beyond physical limits.",
    "bad_code": "# Default /etc/redis/redis.conf on write-heavy system\nsave 900 1\nsave 300 10\nsave 60 10000\n\n# System kernel settings allowing THP allocation (bad for Redis CoW)\n# $ cat /sys/kernel/mm/transparent_hugepage/enabled\n# [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the OS kernel level to prevent 2MB page CoW multiplication, tune system overcommit handling, and adjust Redis snapshotting strategy. Move snapshotting responsibilities to a dedicated read-replica instance or replace continuous RDB background snapshots with AOF (Append Only File) configured with everysec synchronization.",
    "good_code": "# 1. Disable THP and set overcommit memory via host/container sysctl\n# Execute at host initialization:\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# 2. Optimized redis.conf:\n# Disable automatic BGSAVE on primary node\nsave \"\"\n\n# Rely on AOF with controlled rewrite parameters\nappendonly yes\nappendfsync everysec\nno-appendfsync-on-rewrite yes\nauto-aof-rewrite-percentage 100\nauto-aof-rewrite-min-size 64mb",
    "verification": "Inspect Redis stats using `redis-cli INFO persistence`. Check that `latest_fork_usec` is minimal (sub-50ms) and monitor `mem_fragmentation_ratio` and system free memory during persistence routines to verify absence of CoW memory inflation.",
    "date": "2026-09-26",
    "id": 1790410021,
    "type": "error"
});