window.onPostDataLoaded({
    "title": "Mitigating Redis Fork-Induced Latency Spikes",
    "slug": "redis-fork-latency-spikes",
    "language": "SQL",
    "code": "LatencyError",
    "tags": [
        "SQL",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background persistence (BGSAVE or AOF rewrite), it calls the <code>fork()</code> system call. On Linux, this utilizes Copy-on-Write (CoW). If the parent process manages a large dataset and receives many writes during the fork, the OS must copy memory pages, leading to significant CPU usage and 'stalling' the main Redis thread, causing latency spikes for clients.</p>",
    "root_cause": "Transparent Huge Pages (THP) and large page table sizes significantly increase the time it takes for the kernel to complete the fork operation and manage page faults during CoW.",
    "bad_code": "# Default Redis config on some distros\nsave 60 10000\n# THP enabled in /sys/kernel/mm/transparent_hugepage/enabled",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and adjust the `slowlog` to identify fork duration. Consider using 'repl-diskless-sync' if the disk I/O is the bottleneck during the fork.",
    "good_code": "# Disable THP via Shell\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Redis Config optimization\nCONFIG SET latency-monitor-threshold 100",
    "verification": "Check Redis logs for 'Slowest events' or run `redis-cli INFO commandstats` to see if 'fork' calls correlate with latency peaks.",
    "date": "2026-04-19",
    "id": 1776582461,
    "type": "error"
});