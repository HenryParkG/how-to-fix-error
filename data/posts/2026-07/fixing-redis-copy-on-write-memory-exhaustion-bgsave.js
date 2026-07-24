window.onPostDataLoaded({
    "title": "Fixing Redis Copy-on-Write Memory Exhaustion During BGSAVE",
    "slug": "fixing-redis-copy-on-write-memory-exhaustion-bgsave",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Redis",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots via <code>BGSAVE</code> or active replication via <code>PSYNC</code>, it forks a child process relying on Linux Copy-on-Write (COW). Under high-throughput write workloads, modifying existing keys forces memory pages to duplicate rapidly, doubling Redis memory consumption and causing the Linux kernel to OOM kill the process.</p>",
    "root_cause": "Host Linux kernel memory overcommit policy set incorrectly alongside active dirty page duplication during BGSAVE under heavy write throughput.",
    "bad_code": "# Default kernel settings often prevent overcommit allocation\nsysctl vm.overcommit_memory=0\n\n# redis.conf missing snapshot write memory limits\nmaxmemory 8gb\nmaxmemory-policy volatile-lru",
    "solution_desc": "Enable kernel memory overcommit (`vm.overcommit_memory = 1`), reserve at least 33-50% overhead in `maxmemory` relative to host allocation, and disable Transparent Huge Pages (THP) to prevent 2MB page allocation amplification during COW operations.",
    "good_code": "# Set host sysctl options via startup host setup\nsysctl vm.overcommit_memory=1\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# redis.conf adjustments for 16GB RAM system\nmaxmemory 10gb\nmaxmemory-policy allkeys-lru",
    "verification": "Inspect `/proc/sys/vm/overcommit_memory` to verify '1', check `INFO memory` for `cow_bytes` during high-throughput `BGSAVE` benchmarks, and verify no OOM ejections occur.",
    "date": "2026-07-24",
    "id": 1784857777,
    "type": "error"
});