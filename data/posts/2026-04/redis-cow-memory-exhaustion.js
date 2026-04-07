window.onPostDataLoaded({
    "title": "Fixing Redis COW Memory Exhaustion during RDB Snapshots",
    "slug": "redis-cow-memory-exhaustion",
    "language": "Go",
    "code": "OOM Error",
    "tags": [
        "Go",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses the <code>fork()</code> system call to create a background process for RDB snapshotting. Due to Copy-On-Write (COW), if the parent process receives many write commands during this period, the OS duplicates memory pages for those updates. In write-heavy environments, this can double the memory usage, triggering the Linux OOM Killer or exhausting Kubernetes node resources.</p>",
    "root_cause": "High write throughput during BGSAVE causing rapid memory page duplication through the kernel's COW mechanism.",
    "bad_code": "# sysctl.conf\nvm.overcommit_memory = 0\n# redis.conf\nmaxmemory 8gb\n# Problem: Default kernel denies fork under high load or OOM kills if 1",
    "solution_desc": "Set vm.overcommit_memory to 1 to allow the fork, then tune 'maxmemory' to leave a 25-40% buffer for COW. Alternatively, use 'active-defrag' or schedule snapshots during low-traffic windows to minimize page dirtying.",
    "good_code": "# Set kernel to allow overcommit\nsysctl vm.overcommit_memory=1\n# In redis.conf, set maxmemory lower than total RAM to accommodate COW\nmaxmemory 5gb\n# Disable Transparent Huge Pages (THP) to reduce COW overhead\necho never > /sys/kernel/mm/transparent_hugepage/enabled",
    "verification": "Check 'mem_fragmentation_ratio' and 'used_memory_peak' in Redis INFO output during an active BGSAVE command.",
    "date": "2026-04-07",
    "id": 1775556089,
    "type": "error"
});