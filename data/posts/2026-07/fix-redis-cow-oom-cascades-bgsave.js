window.onPostDataLoaded({
    "title": "Fix Redis CoW OOM Cascades During High-Throughput BGSAVE",
    "slug": "fix-redis-cow-oom-cascades-bgsave",
    "language": "C / Redis",
    "code": "OOM / CoW Exhaustion",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis relies on Linux fork() memory copy-on-write (CoW) semantics when executing persistence operations via BGSAVE or AOFRW. Under high write throughput, background snapshotting forces the parent process to duplicate modified memory pages in real-time. If transparent huge pages (THP) are enabled or write rates alter a significant percentage of key allocations, memory consumption doubles rapidly.</p><p>When combined with high maxmemory thresholds, Linux OOM killer targets the Redis parent process, tearing down primary cache clusters and causing cascading failure downstream across all API consumers.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) allocations forced 2MB page duplications for tiny 4KB writes, combined with aggressive write rates during snapshotting and lack of memory overcommit safety cushions.",
    "bad_code": "# /etc/sysctl.conf (Vulnerable configuration)\nvm.overcommit_memory = 0\n# THP enabled on Linux system\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# redis.conf\nmaxmemory 14gb # Executing on a 16gb host leaving no room for CoW overhead\nsave 60 10000",
    "solution_desc": "Disable Transparent Huge Pages (THP), configure kernel memory overcommit settings, and reserve 30-40% memory headroom for CoW page updates by lowering Redis maxmemory limits.",
    "good_code": "# System Configuration\nsysctl -w vm.overcommit_memory=1\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# redis.conf optimized settings\n# Keep maxmemory at 65% of total system memory (e.g. 10GB on 16GB host)\nmaxmemory 10737418240\nmaxmemory-policy volatile-lru\n\n# Optimize background snapshotting\nrdbcompression yes\nrdbchecksum yes",
    "verification": "Run redis-cli info persistence during high write benchmarks using memtier_benchmark and verify allocator_frag_ratio and mem_aof_delayed_fsync remain within stable limits without kernel OOM invocations.",
    "date": "2026-07-22",
    "id": 1784698815,
    "type": "error"
});