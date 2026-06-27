window.onPostDataLoaded({
    "title": "Fixing Redis Latency Spikes from CoW Memory Exhaustion",
    "slug": "redis-fork-latency-cow-exhaustion",
    "language": "Redis",
    "code": "OOM / Latency Spike",
    "tags": [
        "Docker",
        "Infra",
        "Redis",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background persistence operations such as RDB snapshotting (BGSAVE) or AOF rewriting (BGREWRITEAOF), it spins up a background process by calling the kernel's fork() system call. This mechanism relies on the operating system's Copy-on-Write (CoW) page allocation strategy. Initially, parent and child processes share the same physical memory pages. As writes hit the master Redis thread, the operating system copies modified pages to isolate memory states.</p><p>Under highly concurrent write-heavy workloads, this causes a rapid surge in physical memory allocation. If the host operating system has Transparent Huge Pages (THP) enabled, the minimum page allocation granularity escalates from 4KB to 2MB. This increases the memory footprint during modifications by up to 512 times, exhausting physical RAM. The resulting memory pressure forces the kernel to reclaim pages, trigger swap, or invoke the Out-Of-Memory (OOM) killer, generating massive sub-second latency spikes and degradation in throughput.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) are enabled, forcing the operating system to allocate 2MB huge pages during Copy-on-Write memory duplication when processing background saves. This dramatically increases memory allocation overhead and write-amplification under write-heavy loads, leading to memory exhaustion and kernel-level page allocation pauses.",
    "bad_code": "#!/bin/bash\n# Production configuration setup susceptible to latency spikes during fork operations\n\n# 1. Transparent Huge Pages (THP) is left active on the kernel level\necho \"always\" > /sys/kernel/mm/transparent_hugepage/enabled\necho \"always\" > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Memory overcommit is set to default (0), which might cause fork() to fail if memory is tight\nsysctl vm.overcommit_memory=0\n\n# 3. Redis is configured with high-frequency RDB snapshots on large datasets\nredis-cli CONFIG SET save \"60 10000\"",
    "solution_desc": "Disable Transparent Huge Pages (THP) to reduce CoW page-copy granularity back to 4KB. Change the kernel's memory overcommit policy to '1' to allow memory allocations during fork regardless of current virtual memory limits. Lastly, configure optimal Redis persistence options and allocate sufficient system swap space as a buffer.",
    "good_code": "#!/bin/bash\n# Optimizing the Linux system environment and Redis configurations to prevent CoW memory exhaustion\n\n# 1. Disable Transparent Huge Pages permanently on the host\necho \"never\" > /sys/kernel/mm/transparent_hugepage/enabled\necho \"never\" > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Configure kernel memory overcommit to always allow memory allocations (1)\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# 3. Apply changes and restart Redis with conservative background snapshot policies\nsysctl -p\nredis-cli CONFIG SET save \"3600 10000\" # Increase interval, reduce snapshot frequency",
    "verification": "Check the Redis latency logs via 'redis-cli --latency' or 'redis-cli LATENCY LATEST' during a BGSAVE run. Verify that '/sys/kernel/mm/transparent_hugepage/enabled' evaluates to '[never]', and inspect the 'latest_fork_usec' field in 'redis-cli info stats' to ensure fork durations remain under 100ms.",
    "date": "2026-06-27",
    "id": 1782526506,
    "type": "error"
});