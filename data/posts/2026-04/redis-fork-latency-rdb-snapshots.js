window.onPostDataLoaded({
    "title": "Resolve Redis Fork Latency Spikes in RDB",
    "slug": "redis-fork-latency-rdb-snapshots",
    "language": "Go",
    "code": "LatencySpike",
    "tags": [
        "SQL",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Redis performs background persistence (RDB snapshots) by calling the <code>fork()</code> system call. While fork is 'copy-on-write', the operating system must still copy the page table of the parent process to the child. For large Redis heaps (e.g., 50GB+), the page table itself can be several hundred megabytes. Copying this table blocks the main event loop, causing latency spikes that can trigger application timeouts or sentinel failovers.</p>",
    "root_cause": "The time complexity of the fork() system call is proportional to the size of the process page table, leading to blocking stalls on large memory allocations.",
    "bad_code": "# Default configuration on high-traffic large instances\nsave 900 1\nsave 300 10\n# Transparent Huge Pages (THP) often enabled at OS level",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the OS level, as it increases COWrite overhead. Additionally, consider increasing the 'repl-backlog-size' and switching to AOF with 'appendfsync everysec' to reduce the frequency of full RDB forks.",
    "good_code": "# Shell commands to optimize OS\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# Redis Config\nCONFIG SET save \"\"\nCONFIG SET appendonly yes",
    "verification": "Use 'redis-cli --latency' and check the 'latest_fork_usec' metric in 'INFO stats' to ensure fork times are under 100ms.",
    "date": "2026-04-22",
    "id": 1776852913,
    "type": "error"
});