window.onPostDataLoaded({
    "title": "Fixing Redis COW Latency Spikes During RDB Forks",
    "slug": "fixing-redis-cow-latency-spikes-rdb-fork",
    "language": "Redis",
    "code": "COWLatencySpike",
    "tags": [
        "Redis",
        "Performance",
        "Linux",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background persistence process (via <code>BGSAVE</code> or background AOF rewrites), it calls the <code>fork()</code> system call. Under heavy write loads, Linux uses Copy-On-Write (COW) to replicate modified memory pages. If Transparent Huge Pages (THP) are enabled on the host, the kernel attempts to copy huge 2MB memory blocks instead of standard 4KB blocks during modifications. This introduces massive, unexpected page allocation latencies, causing Redis transaction processing times to spike and client connections to time out.</p>",
    "root_cause": "Transparent Huge Pages (THP) enabled on the host machine combined with active write traffic during a Redis fork operation, forcing massive 2MB page allocation copies instead of standard 4KB pages.",
    "bad_code": "# Current runtime configuration on the host allowing THP:\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n# Redis overcommit config is too restrictive for huge allocations:\nsysctl vm.overcommit_memory=0",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the host OS level to force the kernel to copy standard 4KB pages. Additionally, set the kernel overcommit memory flag to 1 to prevent memory allocation failures during fork.",
    "good_code": "# 1. Disable Transparent Huge Pages permanently\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Configure system overcommit to allow optimal memory reservation\nsudo sysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" | sudo tee -a /etc/sysctl.conf\n\n# 3. Apply changes instantly without service disruption\nsudo sysctl -p",
    "verification": "Run `redis-cli info stats` and look at the `latest_fork_usec` metric. Ensure it stays under several milliseconds instead of hundreds of milliseconds during active BGSAVE operations.",
    "date": "2026-05-23",
    "id": 1779502051,
    "type": "error"
});