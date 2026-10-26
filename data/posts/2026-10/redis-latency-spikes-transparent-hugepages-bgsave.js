window.onPostDataLoaded({
    "title": "Mitigate Redis Latency Spikes from THP During BGSAVE",
    "slug": "redis-latency-spikes-transparent-hugepages-bgsave",
    "language": "Docker",
    "code": "KERNEL_THP_COW_LATENCY",
    "tags": [
        "Docker",
        "Linux",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Redis persists datasets to disk through snapshotting (`BGSAVE`) and Append-Only File rewriting (`BGREWRITEAOF`). These operations invoke the POSIX `fork()` system call to spawn a background child process that shares the memory address space of the parent Redis server via Copy-on-Write (COW) pages.</p><p>When Transparent HugePages (THP) is active in the Linux kernel (`/sys/kernel/mm/transparent_hugepage/enabled` set to `always`), the kernel manages memory pages in 2MB blocks rather than standard 4KB pages. During a background save operation, if Redis receives write traffic that touches even a single byte within an existing key, the kernel must duplicate an entire 2MB huge page. This causes severe memory amplification, cache thrashing, and prolonged page allocation latency. The primary Redis event loop blocks during page faults, leading to random latency spikes ranging from tens of milliseconds to several seconds, often causing client timeouts and sentinel failovers.</p>",
    "root_cause": "Kernel Transparent HugePages (THP) enforces 2MB memory page allocations during Copy-on-Write (COW) operations triggered by Redis background fork processes, causing massive write amplification and stalling the single-threaded event loop.",
    "bad_code": "# BUG: Deploying Redis on a host or container with default THP enabled\n# Dockerfile / Container configuration lacking host-level kernel tuning\nFROM redis:7.2-alpine\n\n# Container startup without memory overcommit or THP mitigation\nCMD [\"redis-server\", \"--appendonly\", \"yes\", \"--save\", \"60\", \"1000\"]",
    "solution_desc": "Disable Transparent HugePages completely across host worker nodes by setting the kernel parameter to `never` at boot time or via systemd/init scripts. In containerized environments (Docker/Kubernetes), deploy a privileged init container or DaemonSet that writes `never` to sysfs, and configure `vm.overcommit_memory = 1` in `/etc/sysctl.conf` to avoid allocation rejections on fork.",
    "good_code": "# FIXED: Host / DaemonSet Init Script to disable THP and enable memory overcommit\n#!/bin/sh\nset -eu\n\n# Disable Transparent HugePages\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Ensure Linux overcommit memory is configured for Redis COW requirements\nsysctl -w vm.overcommit_memory=1\n\n# Verify settings\ngrep -E '\\[never\\]' /sys/kernel/mm/transparent_hugepage/enabled",
    "verification": "Connect via `redis-cli` and run `INFO Persistence`. Inspect `latest_fork_usec` to confirm fork execution times remain below 50,000 microseconds (50ms). Execute `redis-cli --latency -h <host>` during a forced `BGSAVE` and verify that the 99th percentile response latency stays well under 2ms without spikes.",
    "date": "2026-10-26",
    "id": 1793002889,
    "type": "error"
});