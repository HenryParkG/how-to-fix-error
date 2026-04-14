window.onPostDataLoaded({
    "title": "Mitigating Redis Fork Latency Spikes and HugePages",
    "slug": "redis-fork-latency-cow-hugepages",
    "language": "C",
    "code": "Latency Spike",
    "tags": [
        "Infra",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses a background process (fork) to handle RDB snapshots or AOF rewriting. Linux's Copy-on-Write (CoW) mechanism manages memory during this fork. However, if Transparent Huge Pages (THP) are enabled, the kernel uses 2MB pages instead of 4KB pages. When a write occurs, the kernel must copy a whole 2MB page even for a tiny update, causing massive 'alloc_pages' latency and memory pressure during the fork.</p>",
    "root_cause": "Transparent Huge Pages (THP) causing high overhead during Copy-on-Write (CoW) operations after a Redis fork.",
    "bad_code": "# Current system status often found in problematic nodes\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages at the OS level and ensure 'vm.overcommit_memory' is set to 1 to allow the kernel to allocate the fork space even if it exceeds physical RAM limits temporarily.",
    "good_code": "# Disable THP dynamically\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Persist in sysctl.conf\necho 'vm.overcommit_memory = 1' >> /etc/sysctl.conf\nsysctl -p",
    "verification": "Check Redis 'latency doctor' or logs for 'Fork took X.XX seconds' messages. Monitor 'latest_fork_usec' in `redis-cli info stats` to ensure it remains under 100ms for large datasets.",
    "date": "2026-04-14",
    "id": 1776143748,
    "type": "error"
});