window.onPostDataLoaded({
    "title": "Mitigating Redis COW Memory Exhaustion",
    "slug": "redis-rdb-cow-memory-exhaustion",
    "language": "Redis",
    "code": "OOM_Killed",
    "tags": [
        "Docker",
        "SQL",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>During RDB snapshots (BGSAVE), Redis forks a child process. Linux uses Copy-on-Write (COW) to share memory pages. In high-write environments, every update to a key causes the OS to duplicate that memory page. If 50% of keys are updated during a snapshot, memory usage can spike by 50%, potentially triggering the OOM killer.</p>",
    "root_cause": "Excessive page duplication during the fork-based background save process under high write throughput.",
    "bad_code": "# Default Redis config on a low-memory VM\nsave 60 10000\n# Linux setting: vm.overcommit_memory = 0",
    "solution_desc": "Increase `vm.overcommit_memory` to 1 to allow the fork to succeed, and ensure the system has sufficient swap or physical RAM headroom (at least 25-50% of the Redis dataset size) for high-write windows.",
    "good_code": "# Set kernel params\nsysctl vm.overcommit_memory=1\n\n# In redis.conf, disable THP (Transparent Huge Pages)\necho never > /sys/kernel/mm/transparent_hugepage/enabled",
    "verification": "Check 'info persistence' in Redis CLI to monitor 'rdb_last_cow_size' and ensure it stays within safe hardware limits.",
    "date": "2026-04-24",
    "id": 1777016976,
    "type": "error"
});