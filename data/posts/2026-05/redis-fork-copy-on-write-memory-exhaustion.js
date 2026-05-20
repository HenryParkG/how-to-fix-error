window.onPostDataLoaded({
    "title": "Mitigating Redis Fork-Induced CoW Memory Exhaustion",
    "slug": "redis-fork-copy-on-write-memory-exhaustion",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Infra",
        "Redis",
        "Error Fix"
    ],
    "analysis": "<p>When Redis issues a background snapshot (BGSAVE or AOF Rewrite), it forks a child process to write the database state to disk. Linux utilizes Copy-on-Write (CoW) to share physical memory pages between the parent and child processes.</p><p>However, write-heavy traffic during the fork forces the OS to copy modified pages instantly. Under unoptimized configurations, this causes memory usage to double, triggering the Out-of-Memory (OOM) Killer.</p>",
    "root_cause": "The system's overcommit memory is disabled, or Transparent Huge Pages (THP) is active. THP increases the allocation block size from 4KB to 2MB, inflating minor writes into massive allocations that drain system RAM.",
    "bad_code": "version: '3.8'\nservices:\n  redis:\n    image: redis:7.0-alpine\n    ports:\n      - \"6379:6379\"\n    # Default Redis configuration on a host with THP enabled and restricted overcommit limits",
    "solution_desc": "Set host-level kernel configurations to enable memory overcommits, disable Transparent Huge Pages (THP) to constrain allocation sizes back to 4KB, and limit active memory allocation footprints inside Redis.",
    "good_code": "version: '3.8'\nservices:\n  redis:\n    image: redis:7.0-alpine\n    privileged: true\n    ports:\n      - \"6379:6379\"\n    command: >\n      sh -c \"\n      sysctl -w vm.overcommit_memory=1 &&\n      echo never > /sys/kernel/mm/transparent_hugepage/enabled &&\n      redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru --appendonly yes\n      \"",
    "verification": "Check 'INFO persistence' during active snapshot writes, and verify system compliance by validating '/sys/kernel/mm/transparent_hugepage/enabled' outputs '[never]'.",
    "date": "2026-05-20",
    "id": 1779277407,
    "type": "error"
});