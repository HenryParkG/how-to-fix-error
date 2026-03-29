window.onPostDataLoaded({
    "title": "Mitigating Redis COW Memory Spikes",
    "slug": "redis-cow-memory-spikes",
    "language": "Redis / Linux",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "AWS",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses a fork-based persistence model (RDB snapshots or AOF rewrite). When a fork occurs, the child process shares the physical memory pages of the parent via Copy-on-Write (COW). In theory, this is efficient. However, in write-heavy environments, every update to a key in the parent process triggers a 4KB page copy (or worse, 2MB with Huge Pages).</p><p>This often causes memory usage to double during a background save, leading to the Linux OOM (Out Of Memory) killer terminating the Redis process. The problem is exacerbated by Transparent Huge Pages (THP), which forces the OS to copy massive chunks of memory for even tiny key updates.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) and high write-volume during BGSAVE cause the OS to duplicate memory pages faster than the system can provide, leading to memory exhaustion.",
    "bad_code": "# Current OS Setting (Check via terminal)\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n# This 'always' setting is dangerous for Redis snapshots.",
    "solution_desc": "First, disable Transparent Huge Pages at the OS level. Second, configure `maxmemory` to leave enough headroom for COW (typically 60-70% of available RAM). Third, adjust the `overcommit_memory` kernel setting to 1 to allow the fork to succeed even if the OS thinks it might run out of memory.",
    "good_code": "# 1. Disable THP\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# 2. Set Kernel Overcommit\nsysctl vm.overcommit_memory=1\n\n# 3. Redis Config\nmaxmemory 4gb\nmaxmemory-policy allkeys-lru",
    "verification": "Execute `BGSAVE` during a high-load write period and monitor `RSS` (Resident Set Size) memory. Memory usage should stay significantly below 2x the base usage with THP disabled.",
    "date": "2026-03-29",
    "id": 1774760756,
    "type": "error"
});