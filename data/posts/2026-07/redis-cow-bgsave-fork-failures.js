window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE Fork Failures under High Write Load",
    "slug": "redis-cow-bgsave-fork-failures",
    "language": "Redis",
    "code": "OOM / ENOMEM on fork()",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background persistence task (such as <code>BGSAVE</code> or <code>BGREWRITEAOF</code>), it spawns a child process using the Linux <code>fork()</code> system call. This operation leverages Copy-on-Write (CoW). If Redis is subject to high write volume during this period, the OS is forced to clone modified memory pages rapidly. If the host system's memory-overcommit policies are restrictive, or if Transparent Huge Pages (THP) are enabled, this fork can consume massive physical and virtual memory, causing the system call to fail with <code>ENOMEM</code> or triggering the kernel OOM killer.</p>",
    "root_cause": "The Linux kernel defaults to a conservative overcommit memory mode (vm.overcommit_memory = 0), which rejects large virtual memory allocations if it deems there is insufficient headroom. Since a `fork()` technically doubles the virtual memory space of the Redis process, the OS rejects the allocation. Additionally, if Transparent Huge Pages (THP) are enabled, the kernel uses 2MB memory allocation blocks instead of standard 4KB blocks, ballooning the CoW footprint up to 512 times for small writes.",
    "bad_code": "# Current OS parameters (problematic configuration)\n$ sysctl vm.overcommit_memory\nvm.overcommit_memory = 0\n\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n# Redis Log Output showing failure:\n# [1204] * Background saving started by pid 15032\n# [1204] # Can't save in background: fork: Cannot allocate memory",
    "solution_desc": "To fix this issue, configure the host operating system to allow memory overcommitting by setting `vm.overcommit_memory` to `1`. Disable Transparent Huge Pages (THP) to force 4KB page allocation, which prevents memory amplification during high-write workloads. Finally, set a conservative `maxmemory` limit in `redis.conf` to guarantee at least 30-40% of system RAM remains free as an allocation buffer for the `BGSAVE` process.",
    "good_code": "# 1. Set kernel overcommit to 1 (Always overcommit)\n$ sudo sysctl vm.overcommit_memory=1\n$ echo \"vm.overcommit_memory = 1\" | sudo tee -a /etc/sysctl.conf\n\n# 2. Disable Transparent Huge Pages (THP) immediately and persistently\n$ sudo echo never > /sys/kernel/mm/transparent_hugepage/enabled\n$ sudo echo never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 3. Adjust redis.conf configuration limits (leave headroom on a 16GB RAM node)\n# maxmemory 11gb (approx 70% of total host RAM)\n# maxmemory-policy volatile-lru",
    "verification": "Verify the memory-overcommit state using `cat /proc/sys/vm/overcommit_memory`, which should return `1`. Monitor memory usage and background persistence status by executing `redis-cli INFO persistence` and check the `rdb_last_bgsave_status` field. Under high write load, trigger a test manual save with `redis-cli BGSAVE` to confirm the fork succeeds without error.",
    "date": "2026-07-18",
    "id": 1784369397,
    "type": "error"
});