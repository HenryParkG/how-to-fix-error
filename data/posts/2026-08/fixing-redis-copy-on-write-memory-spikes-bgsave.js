window.onPostDataLoaded({
    "title": "Fixing Redis Copy-on-Write Memory Spikes During BGSAVE",
    "slug": "fixing-redis-copy-on-write-memory-spikes-bgsave",
    "language": "Redis",
    "code": "OOMKilled",
    "tags": [
        "Redis",
        "Database",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>During background snapshotting (BGSAVE) or AOF rewrite operations, Redis forks a child process. Linux uses Copy-on-Write (CoW) to share physical memory pages between parent and child. However, if there is a high write throughput while snapshotting is active, Linux duplicates modified 4KB (or transparent huge pages of 2MB) pages. Transparent Huge Pages (THP) drastically inflate memory usage because modifying 1 byte forces a 2MB copy, causing massive memory spikes and triggering OOM Killer.</p>",
    "root_cause": "Enabled Transparent Huge Pages (THP) and default Linux memory overcommit settings cause massive CoW memory amplification during high-write throughput during Redis child process forks (BGSAVE/AOFRW).",
    "bad_code": "# Default vulnerable server status\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\nsysctl vm.overcommit_memory\n# Output: vm.overcommit_memory = 0\n\n# redis.conf under heavy write load\nsave 60 10000\nmaxmemory 8gb\n# Result: Kernel OOM kills Redis during BGSAVE due to 2MB THP allocations per key write",
    "solution_desc": "Disable Transparent Huge Pages (THP) at system boot, set Linux vm.overcommit_memory = 1, configure Redis maxmemory with an appropriate maxmemory-policy, and tune snapshot frequency or use replica-offloaded snapshots.",
    "good_code": "# 1. Disable THP in system configuration\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# 2. Enable Memory Overcommit in sysctl.conf\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# 3. Configure Redis memory safety in redis.conf\nmaxmemory 6gb  # Leave room for CoW memory (e.g. 75% of RAM)\nmaxmemory-policy volatile-lru\n\n# 4. Offload persistence to replica node if possible\n# (master redis.conf)\nsave \"\"",
    "verification": "Execute `redis-cli INFO persistence` during a high-write workload benchmark and inspect `mem_cow_size` to ensure CoW overhead remains minimal.",
    "date": "2026-08-10",
    "id": 1786323620,
    "type": "error"
});