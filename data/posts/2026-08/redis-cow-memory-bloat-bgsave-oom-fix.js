window.onPostDataLoaded({
    "title": "Resolving Redis Copy-on-Write Bloat and BGSAVE OOM",
    "slug": "redis-cow-memory-bloat-bgsave-oom-fix",
    "language": "C",
    "code": "OOMKilled",
    "tags": [
        "Redis",
        "Docker",
        "Memory Management",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs RDB snapshots via <code>BGSAVE</code> or background AOF rewrites, it forks a child process relying on Linux Copy-on-Write (CoW). Under heavy write workloads, high page modification rates force memory pages to be duplicated. If Linux kernel feature Transparent Huge Pages (THP) is enabled, allocation granularity expands from standard 4KB pages to 2MB huge pages, ballooning memory usage during background persistence and triggering OS Out-Of-Memory (OOM) killer terminations.</p>",
    "root_cause": "Transparent Huge Pages (THP) forces the OS to allocate 2MB chunks when a single byte inside a memory page changes during CoW fork execution. Under dynamic write bursts during `BGSAVE`, this drastically increases RSS memory overhead beyond physical capacity.",
    "bad_code": "# System setup prone to OOM kills during Redis snapshotting\n# /etc/sysctl.conf\nvm.overcommit_memory = 0\n\n# /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n# redis.conf with tight memory limits\nmaxmemory 14gb\n# System host has only 16GB total RAM",
    "solution_desc": "Disable Transparent Huge Pages at the OS kernel level, set `vm.overcommit_memory = 1` to ensure reliable background process memory allocation, and reserve 30-40% headroom between Redis `maxmemory` and total instance memory.",
    "good_code": "# Disable THP runtime and persistently\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Configure overcommit in /etc/sysctl.conf\nsysctl vm.overcommit_memory=1\n\n# Optimized redis.conf allocating CoW headroom\n# System RAM: 16GB -> Allocate ~65% maxmemory to safe baseline\nmaxmemory 10gb\nmaxmemory-policy volatile-lru\nactivedefrag yes",
    "verification": "Execute `redis-cli INFO memory` during a forced background snapshot (`redis-cli BGSAVE`) and inspect `rdb_last_cow_size`. Ensure `allocator_frag_ratio` remains close to 1.0 without triggering container restart events.",
    "date": "2026-08-13",
    "id": 1786596290,
    "type": "error"
});