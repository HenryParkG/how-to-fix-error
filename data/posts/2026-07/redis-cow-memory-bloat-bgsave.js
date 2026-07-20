window.onPostDataLoaded({
    "title": "Fixing Redis CoW Memory Bloat during BGSAVE",
    "slug": "redis-cow-memory-bloat-bgsave",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs a background database save (<code>BGSAVE</code>) or Append-Only File rewrite (<code>BGREWRITEAOF</code>), it forks a child process to serialize keys to disk. Linux uses Copy-on-Write (CoW) to share parent memory pages with the child. However, if Redis handles a massive write volume during this period, modifications cause memory pages to be copied. Under standard configurations, especially with Transparent Huge Pages (THP) enabled, memory usage spikes dynamically, triggering the system Out-Of-Memory (OOM) killer.</p>",
    "root_cause": "Under high write throughput, Linux must copy dirty memory pages. Transparent Huge Pages (THP) forces allocations of 2MB blocks instead of standard 4KB pages. Modifying even 1 byte in a 2MB page results in a full 2MB copy, bloating memory footprint dramatically until the host kills the process.",
    "bad_code": "# Default Dockerfile / system state where kernel optimization is ignored,\n# and redis runs blindly under high write load without kernel tuning.\nFROM redis:7.0-alpine\n\n# RUN configurations are missing crucial OS memory-overcommit \n# and transparent hugepage controls.\nCMD [\"redis-server\", \"--save\", \"60\", \"10000\"]",
    "solution_desc": "Architecturally, solve this by modifying host operating system configurations: 1) Disable Transparent Huge Pages (THP) to keep page granularity at 4KB, reducing CoW duplication size. 2) Set Linux kernel overcommit memory allocation parameter `vm.overcommit_memory = 1` so memory forks can claim necessary virtual space.",
    "good_code": "# Complete Docker/Kubernetes node initialization pattern to disable THP and enable overcommit\n# This initialization script runs on the host nodes or via privileged init-containers\n\n#!/usr/bin/env bash\nset -euo pipefail\n\n# 1. Set host virtual memory overcommit to safe mode\nsudo sysctl vm.overcommit_memory=1\n\n# 2. Disable Transparent Huge Pages (THP) dynamically on the host kernel\nif test -f /sys/kernel/mm/transparent_hugepage/enabled; then\n  echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\nfi\nif test -f /sys/kernel/mm/transparent_hugepage/defrag; then\n  echo never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag\nfi\n\n# 3. Configure Redis configuration inside deployment to manage defrag overhead\n# redis.conf:\n# active-defrag-ignore-bytes 100mb\n# maxmemory 4gb\n# maxmemory-policy volatile-lru",
    "verification": "Query the running Redis memory footprint during `redis-cli BGSAVE`. Check `sysctl vm.overcommit_memory` (should be 1) and confirm active transparent huge pages config is `[never]` by reading `/sys/kernel/mm/transparent_hugepage/enabled`.",
    "date": "2026-07-20",
    "id": 1784527226,
    "type": "error"
});