window.onPostDataLoaded({
    "title": "Resolving Redis CoW OOM During BGSAVE Snapshots",
    "slug": "redis-cow-oom-bgsave",
    "language": "SQL",
    "code": "OOMKiller-RedisFork",
    "tags": [
        "SQL",
        "Docker",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses a fork-based background saving mechanism (BGSAVE). During this process, the OS uses Copy-on-Write (CoW). If the parent process experiences high write volume during the snapshot, many memory pages are duplicated. On systems with insufficient memory or strict overcommit settings, the OOM Killer may terminate Redis.</p>",
    "root_cause": "The 'vm.overcommit_memory' kernel parameter is often set to 0, which causes fork() to fail if the OS estimates there isn't enough memory for a full copy of the process, or physical RAM is exhausted by CoW page duplication.",
    "bad_code": "# Default Linux sysctl settings often cause this\n# vm.overcommit_memory = 0\n# Redis log: 'Can't save in background: fork: Cannot allocate memory'",
    "solution_desc": "Set 'vm.overcommit_memory' to 1 to allow the kernel to allocate more memory than physically available, trusting CoW efficiency. Additionally, disable Transparent Huge Pages (THP) as they significantly increase CoW overhead during the BGSAVE fork.",
    "good_code": "# Execute as root\nsysctl vm.overcommit_memory=1\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n# Update /etc/sysctl.conf for persistence\nvm.overcommit_memory = 1",
    "verification": "Monitor 'mem_fragmentation_ratio' and RSS usage during 'redis-cli BGSAVE'. Ensure the 'fork_parent_pid' executes without memory-related error logs in '/var/log/redis/redis-server.log'.",
    "date": "2026-05-17",
    "id": 1779013073,
    "type": "error"
});