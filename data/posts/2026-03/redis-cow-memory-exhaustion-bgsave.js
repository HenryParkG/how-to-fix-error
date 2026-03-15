window.onPostDataLoaded({
    "title": "Mitigating Redis COW Memory Exhaustion during BGSAVE",
    "slug": "redis-cow-memory-exhaustion-bgsave",
    "language": "Infra",
    "code": "OOMKilled",
    "tags": [
        "SQL",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a BGSAVE (background snapshot), it forks a child process. Linux utilizes Copy-on-Write (COW) to share memory pages between the parent and child. If the parent process receives a high volume of 'write' commands during this window, it must copy the original data to new memory pages to keep the child's snapshot consistent.</p><p>In high-write environments, this can lead to memory usage doubling instantly. If the total memory (Redis used memory + COW overhead) exceeds the available RAM/Swap, the Linux OOM Killer will terminate the process.</p>",
    "root_cause": "High write-throughput during a fork-based persistence operation exceeding the physical memory overhead available on the host.",
    "bad_code": "# In redis.conf\nmaxmemory 8gb\n# Problematic if system only has 10gb RAM\n# Snapshot frequency is too high for write-heavy loads\nsave 60 10000",
    "solution_desc": "Set 'overcommit_memory' to 1 in sysctl, increase swap space as a buffer, and optimize the 'maxmemory' setting to leave at least 40-50% overhead for COW if writes are heavy. Alternatively, use 'repl-diskless-sync' if the disk I/O is the bottleneck.",
    "good_code": "# Set OS level overcommit\nsysctl vm.overcommit_memory=1\n\n# In redis.conf: Leave overhead for COW\nmaxmemory 5gb \n# (On a 10gb total RAM system)\n\n# Reduce snapshot frequency or use AOF with incremental fsync\nappendonly yes\nno-appendfsync-on-rewrite yes",
    "verification": "Monitor 'mem_fragmentation_ratio' and 'used_memory_peak' during a manual 'BGSAVE' command using Redis-cli.",
    "date": "2026-03-15",
    "id": 1773550812,
    "type": "error"
});