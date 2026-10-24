window.onPostDataLoaded({
    "title": "Resolve Redis BGSAVE Fork OOM Under Copy-on-Write Mutation",
    "slug": "resolve-redis-bgsave-fork-oom-copy-on-write",
    "language": "Redis",
    "code": "OutdatedCowForkOOM",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>Redis persistence mechanisms (RDB snapshotting via <code>BGSAVE</code> and AOF rewriting via <code>BGREWRITEAOF</code>) rely on the POSIX <code>fork()</code> system call. When a child process is spawned, the operating system does not immediately duplicate Redis's virtual memory; instead, it copies the parent's page tables and marks all pages read-only via Copy-on-Write (CoW).</p><p>In high-throughput write workloads, every modification executed by the parent Redis process forces the Linux kernel to allocate a new physical memory page to separate parent and child states. If Redis consumes 20GB of RAM on a 32GB host, and write mutations modify a significant percentage of existing memory pages during the dump, memory usage doubles toward 40GB. This exceeds physical RAM and swap limits, triggering the Linux kernel's Out-Of-Memory (OOM) killer to terminate either the Redis parent or child process with signal 9.</p>",
    "root_cause": "High-frequency write traffic during active RDB/AOF forks modifies large distributions of memory pages, triggering exhaustive Copy-on-Write memory page duplication that breaches host OS limits.",
    "bad_code": "# Default Redis snapshotting configuration triggering aggressive forks\nsave 900 1\nsave 300 10\nsave 60 10000\n\n# Linux Kernel parameter typically left in default conservative state\n# /etc/sysctl.conf\nvm.overcommit_memory = 0\n# THP (Transparent Huge Pages) left enabled:\n# echo \"always\" > /sys/kernel/mm/transparent_hugepage/enabled",
    "solution_desc": "Disable Transparent Huge Pages (THP) to avoid 2MB page fragmentation during CoW splits (reducing allocation granularities back to 4KB). Configure Linux memory overcommit to mode 1 (`vm.overcommit_memory = 1`). Tune Redis to offload BGSAVE to asynchronous replication replicas or use incremental AOF without frequent full snapshots during peak write hours.",
    "good_code": "# 1. Apply system kernel tunings (/etc/sysctl.conf)\nvm.overcommit_memory = 1\n\n# 2. Disable Transparent Huge Pages (THP) at system startup\n# Run via systemd or init script:\necho \"never\" > /sys/kernel/mm/transparent_hugepage/enabled\necho \"never\" > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 3. Optimize redis.conf snapshot cadence and CoW behavior\n# Disable aggressive auto-snapshots on primary nodes\nsave \"\"\n\n# Enable incremental syncing instead of sudden burst forks\nappendonly yes\nappendfsync everysec\nno-appendfsync-on-rewrite yes\nauto-aof-rewrite-percentage 100\nauto-aof-rewrite-min-size 64mb",
    "verification": "Inspect `/proc/[redis_pid]/smaps` during a `BGSAVE` command to track `Private_Dirty` memory sizes. Ensure that memory growth remains strictly proportional to modified keys rather than 2MB chunk blowouts.",
    "date": "2026-10-24",
    "id": 1792828270,
    "type": "error"
});