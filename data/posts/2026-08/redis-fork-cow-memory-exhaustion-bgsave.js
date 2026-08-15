window.onPostDataLoaded({
    "title": "Mitigate Redis CoW Memory Spikes During BGSAVE",
    "slug": "redis-fork-cow-memory-exhaustion-bgsave",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Kubernetes",
        "AWS",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots (<code>BGSAVE</code>) or Append-Only File rewriting (<code>BGREWRITEAOF</code>), it creates a point-in-time snapshot using the Linux <code>fork()</code> system call. Although the child process initially shares identical memory pages with the parent via Copy-on-Write (CoW), incoming write operations on the parent process force dirty page duplicates.</p><p>When Transparent Huge Pages (THP) are enabled in the Linux kernel, any single-byte modification inside a 2MB page forces the kernel to duplicate the full 2MB page instead of a standard 4KB page. Under heavy write traffic during snapshots, memory consumption doubles rapidly, triggering the Linux kernel Out-of-Memory (OOM) killer to terminate the Redis instance.</p>",
    "root_cause": "Transparent Huge Pages (THP) forcing 2MB page allocations on minor key writes combined with insufficient memory overcommit configurations (vm.overcommit_memory != 1) during fork operations.",
    "bad_code": "# Container/Host configuration causing OOM during BGSAVE\n# Dockerfile / Host commands\nFROM redis:7.2\n\n# System default often has THP enabled and restricted overcommit:\n# RUN echo \"always\" > /sys/kernel/mm/transparent_hugepage/enabled (Default in some distros)\n# RUN sysctl vm.overcommit_memory=0\n\n# redis.conf without memory limits and aggressive snapshotting\n# redis.conf content:\n# maxmemory 28gb   (on a 32gb node, leaving no buffer for fork CoW pages)\n# save 60 100000   (triggers frequent forks under write spikes)",
    "solution_desc": "Disable Transparent Huge Pages at host boot, set `vm.overcommit_memory = 1` to permit memory reservations for fork allocations, enforce Redis `maxmemory` caps with strict eviction policies (e.g., `volatile-lru`), and enable incremental fsync via `rdb-save-incremental-fsync yes` to minimize memory bus contention.",
    "good_code": "# Host-level sysctl configuration (host / /etc/sysctl.conf):\n# vm.overcommit_memory = 1\n# Disable THP: echo never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Production redis.conf\nmaxmemory 20gb                     # Leave 30-40% host RAM headroom for CoW overhead\nmaxmemory-policy allkeys-lru\n\n# Optimize snapshotting behavior\nsave 900 1\nsave 300 100\nsave 60 10000\nrdbcompression yes\nrdb-save-incremental-fsync yes    # Sync RDB blocks incrementally to minimize CoW write bursts\n\n# Docker Compose safety enforcement\n# services:\n#   redis:\n#     image: redis:7.2-alpine\n#     sysctls:\n#       - vm.overcommit_memory=1\n#     deploy:\n#       resources:\n#         limits:\n#           memory: 24G",
    "verification": "Trigger an artificial write flood using `redis-benchmark -t set -n 1000000` while executing `redis-cli BGSAVE`. Verify using `redis-cli INFO persistence` that `rdb_last_bgsave_status` reports `ok` and `rdb_last_cow_size` remains well within provisioned memory bounds.",
    "date": "2026-08-15",
    "id": 1786754463,
    "type": "error"
});