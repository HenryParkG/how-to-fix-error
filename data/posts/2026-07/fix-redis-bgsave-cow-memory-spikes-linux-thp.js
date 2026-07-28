window.onPostDataLoaded({
    "title": "Fix Redis BGSAVE Memory Spikes Caused by Linux THP",
    "slug": "fix-redis-bgsave-cow-memory-spikes-linux-thp",
    "language": "C / Redis",
    "code": "OOM / Memory Spike",
    "tags": [
        "Redis",
        "Kubernetes",
        "Docker",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers background snapshotting (`BGSAVE`) or append-only file rewriting (`AOF`), it calls `fork()` to create a child process. The child process relies on Linux Copy-on-Write (CoW) page management to share parent memory pages safely. However, when Linux Transparent Huge Pages (THP) is enabled, the OS manages memory in 2MB huge pages instead of default 4KB pages. During high write throughput, modifying even a single byte forces Linux to duplicate an entire 2MB page, escalating system memory usage and triggering out-of-memory (OOM) kernel kills.</p>",
    "root_cause": "Transparent Huge Pages drastically increase the memory allocation granularity during CoW operations. A high frequency of write operations during Redis snapshotting forces full 2MB page allocations per write, causing Copy-on-Write memory overhead to swell up to 500x higher than normal.",
    "bad_code": "# Kernel runtime check revealing THP active status\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n# Redis log output showing memory warnings during snapshotting\n# WARNING you have Transparent Huge Pages (THP) enabled in your kernel!\n# This will create latency and memory usage issues with Redis.",
    "solution_desc": "Disable Transparent Huge Pages across host nodes and configure Linux memory overcommit behavior (`vm.overcommit_memory = 1`). In containerized environments such as Kubernetes, ensure THP is disabled at the host kernel level or via daemonsets before running high-write Redis pods.",
    "good_code": "# Script to permanently disable THP and configure sysctl for Redis\n#!/usr/bin/env bash\nset -euo pipefail\n\n# Disable THP dynamically\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Set memory overcommit handling in /etc/sysctl.conf\nsysctl vm.overcommit_memory=1\n\n# Persist THP setting via systemd service or kernel boot params\ncat <<EOF > /etc/systemd/system/disable-thp.service\n[Unit]\nDescription=Disable Transparent Huge Pages (THP)\n\n[Service]\nType=oneshot\nExecStart=/bin/sh -c 'echo never > /sys/kernel/mm/transparent_hugepage/enabled && echo never > /sys/kernel/mm/transparent_hugepage/defrag'\n\n[Install]\nWantedBy=basic.target\nEOF\n\nsystemctl enable --now disable-thp.service",
    "verification": "Execute `redis-cli INFO persistence` during a `BGSAVE` command. Verify that `rdb_last_cow_size` remains minimal (proportional to total modified keys) and confirm `/sys/kernel/mm/transparent_hugepage/enabled` displays `never` enclosed in brackets.",
    "date": "2026-07-28",
    "id": 1785217082,
    "type": "error"
});