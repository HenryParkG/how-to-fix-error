window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE CoW Spikes and Kernel THP Traps",
    "slug": "redis-bgsave-cow-memory-spikes-thp-latency",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Redis",
        "Infra",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers an asynchronous snapshot via <code>BGSAVE</code> or background AOF rewrite, it forks a child process using the operating system's Copy-on-Write (CoW) page semantics. Under standard Linux configurations, memory pages are mapped at 4KB increments, meaning writes to the parent process only allocate 4KB for modified chunks.</p><p>However, when Linux Transparent Huge Pages (THP) is active, the kernel allocates and manages memory using 2MB huge pages. If the parent Redis instance receives write operations while <code>BGSAVE</code> is running, the kernel must duplicate an entire 2MB block even if only a single key inside that block was altered. On high-write workloads, this causes exponential memory amplification, triggering container memory ceiling breaches, excessive page compaction latency, and abrupt <code>OOMKilled</code> kernel terminations.</p>",
    "root_cause": "Active Linux Transparent Huge Pages (THP) forces 2MB page allocation copies instead of 4KB pages during Copy-on-Write snapshots, amplifying memory usage and triggering extreme allocation stalls under write-heavy workloads.",
    "bad_code": "# Default container run vulnerable to THP CoW memory explosion\nFROM redis:7.2-alpine\n\nCMD [\"redis-server\", \"--save\", \"60\", \"1000\", \"--maxmemory\", \"4gb\"]",
    "solution_desc": "Disable Transparent Huge Pages at the host kernel level or container runtime, set the Linux virtual memory overcommit policy to 1 (heuristic bypass), and cap the snapshot write volume by scheduling BGSAVE outside peak mutation traffic.",
    "good_code": "# Host-level sysctl configuration & container startup\n# 1. Host settings (run on host or privileged daemonset):\n# sysctl vm.overcommit_memory=1\n# echo never > /sys/kernel/mm/transparent_hugepage/enabled\n\nFROM redis:7.2-alpine\n\n# Configure redis with conservative memory overhead and disable THP awareness\nCOPY redis.conf /usr/local/etc/redis/redis.conf\n# Inside redis.conf:\n# maxmemory 3gb\n# maxmemory-policy allkeys-lru\n# stop-writes-on-bgsave-error yes\n# rdbcompression yes\n\nCMD [\"redis-server\", \"/usr/local/etc/redis/redis.conf\"]",
    "verification": "Inspect the output of 'cat /sys/kernel/mm/transparent_hugepage/enabled' to confirm '[never]' is selected. Check 'redis-cli info persistence' for 'rdb_last_cow_size' to confirm memory consumption during snapshots remains within expected megabyte boundaries.",
    "date": "2026-10-20",
    "id": 1792483588,
    "type": "error"
});