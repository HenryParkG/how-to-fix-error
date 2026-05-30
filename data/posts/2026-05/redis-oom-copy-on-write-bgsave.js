window.onPostDataLoaded({
    "title": "Fixing Redis OOM from COW Memory Spikes during BGSAVE",
    "slug": "redis-oom-copy-on-write-bgsave",
    "language": "Redis",
    "code": "OOM Killer (COW Spike)",
    "tags": [
        "Docker",
        "Kubernetes",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses a single-threaded execution model for handling commands, but relies on process isolation via <code>fork()</code> to manage background persistence operations (such as generating RDB snapshots via <code>BGSAVE</code> or rewriting Append Only Files with <code>BGREWRITEAOF</code>). Under the hood, the Linux kernel uses Copy-on-Write (COW) memory semantics. Instead of duplicating the entire physical memory space instantly, the parent and child processes initially share physical pages.</p><p>However, when client write transactions modify keys during this background window, the OS intercepts the write, clones the target memory pages, and assigns them exclusively to the parent thread. In high-throughput, write-intensive environments, this triggers massive memory allocation spikes. If the underlying host or container memory limits are too close to the active dataset size, the kernel's Out-Of-Memory (OOM) killer abruptly terminates the Redis process.</p>",
    "root_cause": "The kernel allocates copy-on-write pages for every modified memory location during persistence tasks. If Transparent Huge Pages (THP) are enabled, the OS must clone a massive 2MB chunk for even a single byte modification, rather than the standard 4KB page size. This causes a dramatic multiplication of memory overhead, triggering unexpected OOM crashes.",
    "bad_code": "# Current OS and Redis config showing bad defaults\n# 1. Transparent Huge Pages (THP) active\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n# 2. Linux Kernel overcommit parameter is restrictive\nsysctl vm.overcommit_memory\n# Output: vm.overcommit_memory = 0\n\n# 3. Redis is containerized inside Kubernetes without adequate memory overhead margins\n# yaml resource config:\n# resources:\n#   limits:\n#     memory: \"8Gi\"  # Only leaves 5% headroom over a 7.5GiB active Redis DB",
    "solution_desc": "To completely eliminate COW memory spikes, disable Transparent Huge Pages (THP) on the host OS to reduce copy granularity from 2MB to 4KB. Change the Linux memory overcommit policy to 1 (always overcommit). Ensure that you configure containers with a minimum of 25-50% memory headroom over the maximum expected database size, or use a tuned configuration to scale down background write frequencies.",
    "good_code": "# 1. Disable Transparent Huge Pages (THP) immediately on the host OS\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Adjust sysctl parameters to allow safe process virtual memory overcommitment\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# 3. Configure Redis settings to optimize allocation safety\n# Add or edit these directives in your /etc/redis/redis.conf file:\n# disable-active-defrag no # Enable if defragmentation is necessary to reduce allocation overhead\n# save \"\" # If using AOF exclusively, turn off automated RDB snapshot triggers to avoid accidental fork storms",
    "verification": "Verify THP states by reading `/sys/kernel/mm/transparent_hugepage/enabled` ensuring it prints `always madvise [never]`. Trigger a test save with `redis-cli BGSAVE` and monitor copy-on-write metrics dynamically using `redis-cli info persistence` under a sustained write workload.",
    "date": "2026-05-30",
    "id": 1780137829,
    "type": "error"
});