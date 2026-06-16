window.onPostDataLoaded({
    "title": "Fixing Redis OOM-Kills Under BGSAVE CoW",
    "slug": "resolving-redis-oom-kills-bgsave-cow",
    "language": "Redis / Linux",
    "code": "Linux OOM-Killer Triggered during BGSAVE",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses the `fork()` system call to perform background data persistence (`BGSAVE` or `BGREWRITEAOF`). During this operation, the child process writes the memory database to disk. Linux manages this efficiently using Copy-on-Write (CoW). The parent process (Redis server) and child process initially share the same physical memory pages.</p><p>However, if the database receives write commands during a save, Linux must copy the affected memory pages before allowing Redis to modify them. When Transparent Huge Pages (THP) are enabled, Linux copies memory in large 2MB blocks instead of standard 4KB pages. If write-heavy traffic hits Redis during `BGSAVE`, this drastically increases the rate of memory allocation duplication, causing the overall footprint to double and triggering the Linux OOM-Killer.</p>",
    "root_cause": "The Linux kernel's Transparent Huge Pages (THP) forces Copy-on-Write events to allocate 2MB chunks instead of standard 4KB pages. Under high-write volumes during a fork(), this dramatically inflates memory consumption, causing the system to run out of physical memory and swap space.",
    "bad_code": "# Default typical system configurations causing the issue:\n# Transparent Huge Pages are active, and kernel memory overcommit is restricted\n\n# To replicate the issue, check these system configs while Redis is running:\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n$ sysctl vm.overcommit_memory\n# Output: vm.overcommit_memory = 0\n\n# Redis config allow high-frequency saving under heavy loads:\nsave 60 10000\nmaxmemory 8gb\n# With only 12GB total host memory, BGSAVE will cause an OOM kill under heavy writes",
    "solution_desc": "Disable Transparent Huge Pages (THP) across the system to ensure that Copy-on-Write copies small, granular 4KB pages. Additionally, update the Linux kernel overcommit memory settings (`vm.overcommit_memory = 1`) to allow virtual allocations to exceed immediate physical memory limits. Finally, optimize the Redis active defragmentation configurations to control memory overhead.",
    "good_code": "#!/bin/bash\n# Production deployment script to configure Linux kernel parameters for Redis\n\nset -euo pipefail\n\necho \"=== Optimising system settings for Redis BGSAVE ===\"\n\n# 1. Disable Transparent Huge Pages (THP) immediately and permanently\nif [ -f /sys/kernel/mm/transparent_hugepage/enabled ]; then\n    echo never > /sys/kernel/mm/transparent_hugepage/enabled\n    echo never > /sys/kernel/mm/transparent_hugepage/defrag\n    echo \"Transparent Huge Pages disabled.\"\nfi\n\n# 2. Configure kernel overcommit memory to 1\n# This allows forks to allocate virtual memory regardless of physical swap size\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# 3. Increase system swap space as a safe fallback buffer\ndd if=/dev/zero of=/swapfile bs=1M count=4096\nchmod 600 /swapfile\nmkswap /swapfile\nswapon /swapfile\necho \"/swapfile swap swap defaults 0 0\" >> /etc/fstab\n\n# 4. Reconfigure Redis runtime configurations\nredis-cli config set activedefrag yes\nredis-cli config set maxmemory-policy volatile-lru\n\necho \"System optimizations applied successfully.\"",
    "verification": "Trigger a persistent write sequence in Redis and run `redis-cli BGSAVE`. While the process runs, check the memory utilization output with `redis-cli info stats`. Look for the `cow_bytes` metric to verify that memory allocation stays within a safe margin during copy operations.",
    "date": "2026-06-16",
    "id": 1781599214,
    "type": "error"
});