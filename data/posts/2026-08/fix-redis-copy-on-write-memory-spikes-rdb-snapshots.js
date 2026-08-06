window.onPostDataLoaded({
    "title": "Fix Redis Memory Spikes During RDB Snapshots",
    "slug": "fix-redis-copy-on-write-memory-spikes-rdb-snapshots",
    "language": "C",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Linux",
        "Infra",
        "Redis",
        "Error Fix"
    ],
    "analysis": "<p>When Redis executes background snapshotting (<code>BGSAVE</code>) or AOF rewriting, the main process executes a Linux <code>fork()</code> call. The child process reads page table entries to stream memory to disk using Copy-on-Write (CoW). Under normal circumstances, pages are shared safely between parent and child until written to.</p><p>However, under heavy write throughput combined with Linux system settings like Transparent Huge Pages (THP), modifying a single byte forces the kernel to duplicate an entire 2MB memory page instead of a standard 4KB page. This drastically magnifies memory amplification during snapshots, pushing physical RAM consumption far beyond host limits and triggering the OS Out-Of-Memory (OOM) killer to terminate Redis.</p>",
    "root_cause": "Transparent Huge Pages (THP) forces kernel CoW allocation size to jump from 4KB to 2MB per write mutation during child process fork execution, causing massive memory allocation spikes.",
    "bad_code": "# Default vulnerable Linux OS settings\n# /etc/default/grub or sysfs defaults with THP enabled\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# redis.conf under heavy write load\nsave 60 10000\nmaxmemory 12gb # Host has 16GB total RAM",
    "solution_desc": "Disable Transparent Huge Pages at the OS level, configure system memory overcommit to strict allocation policies, adjust snapshotting heuristics, and specify `maxmemory-policy` with explicit CoW memory headroom allocation.",
    "good_code": "# System level fix script before launching Redis\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# redis.conf production optimizations\nmaxmemory 10gb # Reserve ~35% headroom for CoW overhead on 16GB host\nmaxmemory-policy volatile-lru\nrdbcompression yes\nactive-defrag-ignore-bytes 100mb",
    "verification": "Run `redis-cli INFO persistence` during intensive benchmark write workloads (`redis-benchmark -t set -n 1000000 -c 50`). Inspect `rdb_last_cow_size` metric to confirm page allocations remain bounded near baseline memory levels.",
    "date": "2026-08-06",
    "id": 1785980593,
    "type": "error"
});