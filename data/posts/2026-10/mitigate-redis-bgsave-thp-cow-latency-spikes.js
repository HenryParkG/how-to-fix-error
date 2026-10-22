window.onPostDataLoaded({
    "title": "Mitigate Redis BGSAVE Spikes from THP CoW Amplification",
    "slug": "mitigate-redis-bgsave-thp-cow-latency-spikes",
    "language": "Redis / Linux",
    "code": "THP_COW_AMPLIFICATION",
    "tags": [
        "Redis",
        "Linux",
        "Performance",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses background persistence tasks like <code>BGSAVE</code> and <code>BGREWRITEAOF</code> to generate RDB snapshots and compact AOF logs without interrupting the main event loop. This is implemented via the Linux <code>fork()</code> system call, which creates a child process sharing identical physical memory pages with the parent via Copy-on-Write (CoW).</p><p>By default, the Linux memory manager allocates 4KB pages. However, when Transparent Huge Pages (THP) is enabled, the kernel manages memory in 2MB blocks. When Redis receives write operations during an active <code>BGSAVE</code>, writing to a single field or key invalidates the page and forces the kernel to copy the entire 2MB huge page rather than an individual 4KB page. This 512x amplification leads to extreme page allocation latency, sudden RAM exhaustion, kernel spinlock contention, and severe latency spikes (often hundreds of milliseconds) in Redis's single-threaded event loop.</p>",
    "root_cause": "Transparent Huge Pages (THP) enforces 2MB memory page allocations during Copy-on-Write. Modifying a small key during a `BGSAVE` fork forces a full 2MB page allocation, stalling the single-threaded Redis event loop during kernel page copying.",
    "bad_code": "# Common bad environment configuration: Host has THP enabled\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n# Dockerfile running Redis without adjusting kernel THP settings or memory overcommit\nFROM redis:7.2-alpine\nCMD [\"redis-server\", \"--save\", \"60\", \"1000\", \"--stop-writes-on-bgsave-error\", \"yes\"]",
    "solution_desc": "Disable Transparent Huge Pages across the Linux host at boot time and at runtime by writing `never` to `/sys/kernel/mm/transparent_hugepage/enabled`. Additionally, set `vm.overcommit_memory = 1` in `/etc/sysctl.conf` to allow clean memory allocation during forks without speculative kernel rejections.",
    "good_code": "#!/usr/bin/env bash\nset -euo pipefail\n\n# 1. Disable Transparent Huge Pages at runtime\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Configure system-level memory overcommit for Redis forks\nsysctl vm.overcommit_memory=1\n\n# 3. Persist THP disabling across reboots via systemd service\ncat << 'EOF' > /etc/systemd/system/disable-thp.service\n[Unit]\nDescription=Disable Transparent Huge Pages (THP) for Redis\nDefaultDependencies=no\nAfter=sysinit.target local-fs.target\nBefore=mongod.service redis.service redis-server.service\n\n[Service]\nType=oneshot\nExecStart=/bin/sh -c 'echo never > /sys/kernel/mm/transparent_hugepage/enabled && echo never > /sys/kernel/mm/transparent_hugepage/defrag'\n\n[Install]\nWantedBy=basic.target\nEOF\n\nsystemctl daemon-reload\nsystemctl enable --now disable-thp.service",
    "verification": "Check Redis output via `redis-cli INFO persistence` and check `latest_fork_usec` to ensure fork execution times drop to single-digit milliseconds. Run `redis-cli --latency` during an active `BGSAVE` under heavy write workloads to confirm elimination of latency spikes.",
    "date": "2026-10-22",
    "id": 1792656528,
    "type": "error"
});