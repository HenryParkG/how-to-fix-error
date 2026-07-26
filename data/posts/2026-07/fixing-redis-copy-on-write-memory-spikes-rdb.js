window.onPostDataLoaded({
    "title": "Fixing Redis Copy-On-Write Memory Spikes in RDB Snapshots",
    "slug": "fixing-redis-copy-on-write-memory-spikes-rdb",
    "language": "Redis / C",
    "code": "OOM Killer / Memory Spike",
    "tags": [
        "Redis",
        "Memory",
        "Docker",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background snapshot using <code>BGSAVE</code> or <code>BGREWRITEAOF</code>, the parent process invokes <code>fork()</code> to create a child process. The OS relies on Copy-On-Write (COW) page sharing to minimize memory duplication. However, under high write workloads, write operations to existing keys force the kernel to duplicate entire memory pages. When Transparent Huge Pages (THP) are enabled, the kernel copies 2MB pages instead of standard 4KB pages, leading to massive memory spikes and triggering the Linux OOM Killer.</p>",
    "root_cause": "Linux kernel allocating oversized memory pages during Copy-On-Write operations due to enabled Transparent Huge Pages (THP) and default memory overcommit settings during background fork snapshots.",
    "bad_code": "# Default kernel configuration causing aggressive memory page allocations\nvm.overcommit_memory = 0\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# redis.conf under heavy write load\nsave 60 10000\nmaxmemory 12gb",
    "solution_desc": "Disable Transparent Huge Pages (THP) on the host host system to keep COW granularity at 4KB instead of 2MB. Configure kernel overcommit setting `vm.overcommit_memory = 1` to ensure fork calls succeed cleanly. Tune Redis snapshot frequencies or utilize diskless replication.",
    "good_code": "# Kernel configuration fix\nsysctl vm.overcommit_memory=1\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Optimized redis.conf configuration\nmaxmemory 12gb\nmaxmemory-policy volatile-lru\nactivedefrag yes",
    "verification": "Inspect `/sys/kernel/mm/transparent_hugepage/enabled` to verify `[never]` is active. Run `INFO persistence` in Redis during a high-throughput write test and observe `rdb_last_cow_size` to ensure memory overhead remains low.",
    "date": "2026-07-26",
    "id": 1785053344,
    "type": "error"
});