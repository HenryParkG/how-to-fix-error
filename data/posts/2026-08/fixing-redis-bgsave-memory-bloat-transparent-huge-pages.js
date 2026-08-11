window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE Memory Bloat & THP Latency Spikes",
    "slug": "fixing-redis-bgsave-memory-bloat-transparent-huge-pages",
    "language": "Docker",
    "code": "CoW Memory Bloat",
    "tags": [
        "Docker",
        "Redis",
        "Infra",
        "Linux",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots (BGSAVE) or AOF rewrite operations, it forks a child process relying on Linux Copy-on-Write (CoW). If Transparent Huge Pages (THP) is enabled at the host kernel level, page allocation size increases from standard 4KB to 2MB. Consequently, when Redis modifies a single byte in a key during an active BGSAVE, the Linux kernel duplicates an entire 2MB page rather than a 4KB page. This results in extreme memory amplification (up to 512x CoW overhead), triggering Linux Out-Of-Memory (OOM) killer terminations and tail latency spikes due to kernel page allocation locks.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) automatically allocates 2MB contiguous pages. During Redis child process fork execution, write mutations force kernel CoW operations to allocate 2MB chunks. Under high-write workloads, the Resident Set Size (RSS) memory usage explodes beyond physical server limits.",
    "bad_code": "# Dockerfile / Host setup running with default OS THP settings\nFROM redis:7.0-alpine\n\n# /sys/kernel/mm/transparent_hugepage/enabled is [always]\n# Host kernel overcommit memory set to 0\nCMD [\"redis-server\", \"--save\", \"60\", \"1000\", \"--appendonly\", \"yes\"]",
    "solution_desc": "Disable Transparent Huge Pages (THP) at host system boot, set kernel memory overcommit mode to 1 (sysctl vm.overcommit_memory=1), and configure Docker init containers or host systemd scripts to echo 'never' into /sys/kernel/mm/transparent_hugepage/enabled before launching Redis.",
    "good_code": "version: '3.8'\n\nservices:\n  redis-init:\n    image: alpine:latest\n    command: >\n      sh -c \"echo never > /sys/kernel/mm/transparent_hugepage/enabled &&\n             sysctl -w vm.overcommit_memory=1\"\n    privileged: true\n    volumes:\n      - /sys/kernel/mm/transparent_hugepage:/sys/kernel/mm/transparent_hugepage\n\n  redis:\n    image: redis:7.2-alpine\n    depends_on:\n      redis-init:\n        condition: service_completed_successfully\n    command: redis-server --save 60 10000 --appendonly yes --maxmemory 4gb --maxmemory-policy volatile-lru\n    ports:\n      - \"6379:6379\"\n    sysctls:\n      - net.core.somaxconn=1024\n      - vm.overcommit_memory=1",
    "verification": "Execute 'cat /sys/kernel/mm/transparent_hugepage/enabled' and verify the output is '[never]'. Run 'redis-cli info persistence' during BGSAVE to ensure rdb_last_cow_size stays minimal and proportional to modified standard 4KB pages.",
    "date": "2026-08-11",
    "id": 1786441912,
    "type": "error"
});