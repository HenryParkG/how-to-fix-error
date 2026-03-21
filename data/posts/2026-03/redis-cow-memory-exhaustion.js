window.onPostDataLoaded({
    "title": "Resolve Redis CoW Memory Exhaustion during Snapshots",
    "slug": "redis-cow-memory-exhaustion",
    "language": "Redis",
    "code": "OOM_COW_FAILURE",
    "tags": [
        "SQL",
        "Infra",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Redis utilizes the <code>fork()</code> system call to create a background process for RDB snapshots (BGSAVE). This relies on the kernel's Copy-on-Write (CoW) mechanism. In write-heavy environments, the parent and child processes' memory pages diverge rapidly. If the system does not have enough free RAM to accommodate these copied pages, the Linux OOM (Out of Memory) killer will terminate the Redis process, leading to data loss or service interruption.</p>",
    "root_cause": "The Linux kernel's default memory overcommit settings combined with high write volume during a BGSAVE operation causes the physical memory usage to exceed available capacity as CoW triggers page duplication.",
    "bad_code": "# Default /etc/sysctl.conf settings on many systems\nvm.overcommit_memory = 0\n# Redis config without memory limits\nmaxmemory 0",
    "solution_desc": "Set <code>vm.overcommit_memory</code> to 1 to allow the kernel to allocate memory more aggressively for fork(), and configure a <code>maxmemory</code> limit in Redis that leaves at least 25-45% of system RAM free for CoW overhead during snapshots.",
    "good_code": "# Set overcommit to 1 (Always overcommit)\nsysctl vm.overcommit_memory=1\n\n# In redis.conf\nmaxmemory 4gb # On an 8GB RAM machine\nmaxmemory-policy allkeys-lru\n# Enable THP (Transparent Huge Pages) disabling as it increases CoW overhead\necho never > /sys/kernel/mm/transparent_hugepage/enabled",
    "verification": "Monitor the 'mem_fragmentation_ratio' and 'RDB' progress in 'redis-cli info'. Check /var/log/syslog for 'Out of memory: Kill process' messages during scheduled snapshots.",
    "date": "2026-03-21",
    "id": 1774066977,
    "type": "error"
});