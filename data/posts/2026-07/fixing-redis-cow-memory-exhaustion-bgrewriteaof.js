window.onPostDataLoaded({
    "title": "Fixing Redis CoW Memory Exhaustion in BGREWRITEAOF",
    "slug": "fixing-redis-cow-memory-exhaustion-bgrewriteaof",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Redis",
        "Docker",
        "Database",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers an automated BGREWRITEAOF or BGSAVE under heavy concurrent write spikes, Linux fork() utilizes Copy-on-Write (CoW). If Transparent Huge Pages (THP) are enabled on the host kernel, small write operations force full 2MB page allocations instead of standard 4KB pages. Under high mutation throughput, this memory multiplier quickly causes the Redis container memory footprint to double, triggering the Linux kernel Out-Of-Memory (OOM) killer to terminate the primary Redis process.</p>",
    "root_cause": "Linux Kernel Transparent Huge Pages (THP) combined with conservative kernel overcommit memory settings (vm.overcommit_memory = 0) force massive CoW page allocations during child process fork operations for AOF rewriting under heavy write traffic.",
    "bad_code": "# Default vulnerable Docker host sysctl / redis config\n# sysctl vm.overcommit_memory=0\n# /sys/kernel/mm/transparent_hugepage/enabled = [always] madvise never\n\n# redis.conf under heavy write traffic\nmaxmemory 8gb\nmaxmemory-policy volatile-lru\nauto-aof-rewrite-percentage 100\nno-appendfsync-on-rewrite no",
    "solution_desc": "Disable Transparent Huge Pages at system startup, adjust Linux virtual memory overcommit behavior to allow overcommit allocations (vm.overcommit_memory = 1), and enable `no-appendfsync-on-rewrite yes` in redis.conf to prevent latency spikes and reduce memory allocation bursts during rewrite child forks.",
    "good_code": "# System level fix via kernel host / Docker entrypoint\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# redis.conf optimized settings\nmaxmemory 6gb # Leave headroom for CoW overhead on host\nmaxmemory-policy allkeys-lru\nauto-aof-rewrite-percentage 200\nauto-aof-rewrite-min-size 128mb\nno-appendfsync-on-rewrite yes",
    "verification": "Execute `redis-cli INFO memory` during a load test while triggering `BGREWRITEAOF`. Verify `mem_fragmentation_ratio` remains low and check `dmesg -T` on the host machine to confirm zero kernel OOM invocation events.",
    "date": "2026-07-29",
    "id": 1785323651,
    "type": "error"
});