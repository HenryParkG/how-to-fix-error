window.onPostDataLoaded({
    "title": "Redis BGSAVE: Fix CoW Latency & THP Memory Bloat",
    "slug": "redis-bgsave-cow-latency-thp-memory-bloat",
    "language": "Redis / Linux",
    "code": "OOM-Killer / Latency Spike",
    "tags": [
        "Redis",
        "Linux",
        "Performance",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Redis persists memory snapshots to disk using the <code>BGSAVE</code> command, which relies on the Linux <code>fork()</code> system call. The child process receives an exact virtual memory copy of the parent process through Copy-on-Write (CoW). Under normal circumstances, Linux shares physical 4KB memory pages between parent and child until a modification occurs, which then allocates and copies only the affected 4KB page.</p><p>However, when Linux Transparent Huge Pages (THP) is enabled, the kernel manages memory in 2MB huge pages rather than 4KB pages. Under write-heavy workloads, a single byte modification forces the operating system to duplicate an entire 2MB memory block. This triggers two catastrophic failures: massive physical memory allocation bloat that often invokes the Linux OOM-killer, and high page-fault latency spikes that freeze the Redis single-threaded event loop.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) forces 2MB page granularity during fork() Copy-on-Write cycles, exponentially increasing memory allocation overhead and kernel page-fault stall times during disk persistence operations.",
    "bad_code": "# Problematic Linux host configuration\n# THP enabled by default in /sys/kernel/mm/transparent_hugepage/\n\n# Check current status (returns [always] madvise never)\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n# Sub-optimal Redis config with heavy write load and default OS sysctl\n# redis.conf\nsave 60 10000\nmaxmemory 16gb\nmaxmemory-policy volatile-lru\n# vm.overcommit_memory left at default 0 causing fork failures",
    "solution_desc": "Permanently disable Transparent Huge Pages at the kernel boot level or runtime sysfs interface, configure Linux memory overcommit to unrestricted allocation (vm.overcommit_memory = 1), and calibrate the Redis persistence schedule to avoid CoW page-fault amplification.",
    "good_code": "#!/bin/bash\n# 1. Disable Transparent Huge Pages dynamically\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Persist THP disabling across reboots in /etc/rc.local or systemd\n# /etc/sysctl.d/99-redis.conf\nsysctl -w vm.overcommit_memory=1\nsysctl -w net.core.somaxconn=1024\n\n# 3. Redis configuration adjustments (redis.conf)\n# Stop persistence bursts and isolate background forks\nstop-writes-on-bgsave-error yes\nrdbcompression yes\nmaxmemory 12gb\n# Provide head-room for CoW allocations (~25-30% buffer)",
    "verification": "Execute 'redis-cli info persistence' and inspect the 'latest_fork_usec' metric. Confirm that memory usage remains stable during BGSAVE by monitoring '/proc/<redis_pid>/smaps' for 'Anonymous:' allocations while verifying THP is set to 'never'.",
    "date": "2026-10-06",
    "id": 1791258967,
    "type": "error"
});