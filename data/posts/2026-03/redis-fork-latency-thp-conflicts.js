window.onPostDataLoaded({
    "title": "Mitigating Redis Fork-Induced Latency and THP",
    "slug": "redis-fork-latency-thp-conflicts",
    "language": "Rust",
    "code": "REDIS_LATENCY_SPIKE",
    "tags": [
        "Infra",
        "Docker",
        "Rust",
        "Error Fix"
    ],
    "analysis": "<p>Redis performance often degrades during background snapshots (RDB) or AOF rewrites. This is caused by the Linux 'fork()' system call. When Redis forks, the kernel uses Copy-on-Write (CoW). If Transparent Huge Pages (THP) are enabled, the kernel uses 2MB pages instead of 4KB. During a write, if a single byte changes, the kernel must copy the entire 2MB page, leading to massive memory pressure and CPU spikes that block the main Redis event loop.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) forcing 2MB page copies during Redis BGSAVE operations, significantly increasing CoW overhead.",
    "bad_code": "# Default OS configuration often has THP enabled\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "The primary fix is to disable THP at the OS level and tune the kernel overcommit memory settings. By forcing the kernel to use standard 4KB pages, the CoW overhead during a Redis fork is reduced by orders of magnitude. Additionally, setting 'vm.overcommit_memory = 1' ensures the fork succeeds even if the memory footprint is large.",
    "good_code": "# Execute as root to disable THP and optimize overcommit\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\nsysctl vm.overcommit_memory=1",
    "verification": "Check Redis 'LATENCY GRAPH' during a BGSAVE command; spikes should drop from hundreds of milliseconds to low single digits.",
    "date": "2026-03-02",
    "id": 1772444342,
    "type": "error"
});