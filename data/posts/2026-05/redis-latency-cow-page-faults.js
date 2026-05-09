window.onPostDataLoaded({
    "title": "Resolving Redis Latency Spikes from CoW Page Faults",
    "slug": "redis-latency-cow-page-faults",
    "language": "C",
    "code": "LatencySpike",
    "tags": [
        "Infra",
        "Docker",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Redis persistence (BGSAVE/AOF rewrite) utilizes the fork() system call. Due to Linux's Copy-on-Write (CoW) mechanism, the parent and child share memory pages until a write occurs. On systems with Transparent Huge Pages (THP) enabled, a single write triggers a copy of a 2MB page instead of a standard 4KB page, causing massive latency spikes during high-write workloads.</p>",
    "root_cause": "Transparent Huge Pages (THP) forcing the kernel to duplicate 2MB memory chunks during CoW operations, blocking the main Redis event loop.",
    "bad_code": "# Current OS Status showing THP enabled\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level. This forces the kernel to use 4KB pages, significantly reducing the amount of data copied per write-fault during the BGSAVE process.",
    "good_code": "# Execute as root to disable THP\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n# Ensure sysctl vm.overcommit_memory = 1",
    "verification": "Run 'redis-cli --latency' during a BGSAVE operation; spikes should drop from >100ms to <10ms.",
    "date": "2026-05-09",
    "id": 1778320853,
    "type": "error"
});