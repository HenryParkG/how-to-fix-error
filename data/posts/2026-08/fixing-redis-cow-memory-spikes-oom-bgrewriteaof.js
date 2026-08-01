window.onPostDataLoaded({
    "title": "Fixing Redis CoW Memory Spikes & OOM Kills in BGREWRITEAOF",
    "slug": "fixing-redis-cow-memory-spikes-oom-bgrewriteaof",
    "language": "Redis / C",
    "code": "OOMKilled",
    "tags": [
        "Redis",
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses Linux copy-on-write (CoW) during child process creation for persistence operations like BGREWRITEAOF and BGSAVE. When a child process is spawned, it shares the parent process's memory pages. When the parent receives new write operations, Linux allocates new memory pages for modified keys.</p><p>If Transparent Huge Pages (THP) are enabled on the OS, Linux allocates 2MB memory chunks for every CoW allocation instead of standard 4KB pages. Under high-write traffic, memory consumption doubles or triples within seconds during an AOF rewrite, triggering Linux OOM killer signals that terminate the primary Redis process.</p>",
    "root_cause": "Transparent Huge Pages (THP) enabled in the host Linux kernel causes massive memory copy amplification (2MB pages vs 4KB pages) during Copy-on-Write under write-heavy workloads during BGREWRITEAOF.",
    "bad_code": "# Default vulnerable Linux kernel settings\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n$ cat /proc/sys/vm/overcommit_memory\n0\n\n# redis.conf default under heavy write loads\nno-appendfsync-on-rewrite no\naof-rewrite-incremental-fsync no",
    "solution_desc": "Disable Transparent Huge Pages at system startup, set vm.overcommit_memory to 1 to allow efficient memory allocation, and enable aof-rewrite-incremental-fsync in redis.conf to smooth out disk I/O and memory allocations.",
    "good_code": "# Run as root on host system\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# Update redis.conf:\n# Prevent allocation spikes during rewrite\nno-appendfsync-on-rewrite yes\naof-rewrite-incremental-fsync yes\nmaxmemory-policy volatile-lru",
    "verification": "Execute `redis-cli BGREWRITEAOF` under simulated stress test load using `memtier_benchmark` and monitor `INFO memory` `allocator_frag_ratio` and memory usage via `dmesg -w` to ensure no OOM killer invocations occur.",
    "date": "2026-08-01",
    "id": 1785563180,
    "type": "error"
});