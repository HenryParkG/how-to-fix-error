window.onPostDataLoaded({
    "title": "Prevent Redis BGSAVE CoW Memory Spikes & OOM Kills",
    "slug": "redis-bgsave-copy-on-write-oom-killer-evictions",
    "language": "Redis",
    "code": "OOM / SIGKILL",
    "tags": [
        "Docker",
        "Kubernetes",
        "Linux",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Redis persistence mechanisms (RDB snapshots via <code>BGSAVE</code> and AOF background rewrites via <code>BGREWRITEAOF</code>) rely on the POSIX <code>fork()</code> system call. At the moment of forking, the parent and child processes share physical memory pages marked as read-only. When the Redis parent receives write commands during a snapshot, the Linux kernel invokes Copy-on-Write (CoW), copying modified memory pages into new allocations.</p><p>Under high write throughput, CoW page churn rapidly escalates overall resident memory (RSS). This problem is exacerbated when Linux Transparent Huge Pages (THP) is enabled. Because THP manages memory in 2MB continuous pages instead of the standard 4KB architecture, modifying a single key within a 2MB block forces the kernel to copy the entire 2MB block. In containerized environments with strict cgroup limits (e.g., Docker, Kubernetes), this spike exceeds memory limits and triggers the Linux kernel OOM killer, sending <code>SIGKILL</code> to Redis.</p>",
    "root_cause": "High write concurrency during BGSAVE, combined with Linux Transparent Huge Pages (THP) 2MB allocation granularity and unbuffered container memory limits, causes extreme Copy-on-Write memory amplification that triggers cgroup OOM kills.",
    "bad_code": "# Default redis.conf snapshotting enabled on high-write instance\nsave 900 1\nsave 300 10\nsave 60 10000\n\n# Container deployment configuration with insufficient memory overhead\n# docker-compose.yml\n# services:\n#   redis:\n#     image: redis:7.2\n#     deploy:\n#       resources:\n#         limits:\n#           memory: 8G\n# redis.conf:\nmaxmemory 7.5gb\nmaxmemory-policy allkeys-lru",
    "solution_desc": "Disable Transparent Huge Pages (THP) on host nodes, configure `vm.overcommit_memory = 1`, and allocate appropriate memory headroom. Limit `maxmemory` to 55-65% of the container cgroup limit to provide buffer space for Copy-on-Write page divergence during `BGSAVE`. Alternatively, offload snapshot persistence entirely to a read-replica node to keep the master node pure in-memory.",
    "good_code": "# 1. Host OS / Docker host kernel tuning (run on node initialization):\n# echo never > /sys/kernel/mm/transparent_hugepage/enabled\n# sysctl -w vm.overcommit_memory=1\n\n# 2. Optimized redis.conf:\n# Allocate 60% of container memory (for an 8GB container limit, reserve ~3.2GB for CoW)\nmaxmemory 4800mb\nmaxmemory-policy volatile-lru\n\n# Disable aggressive automated snapshots on write-heavy primary;\n# rely on scheduled cron off-peak BGSAVE or replicate to a persistence-only node\nsave \"\"\n\n# Enable deterministic client throttling during high persistence load\nstop-writes-on-bgsave-error yes\nrdbcompression yes\nrdbchecksum yes",
    "verification": "Execute `INFO persistence` in `redis-cli` and inspect the `mem_cow_size` metric during an active `BGSAVE` under heavy load. Verify using `dmesg -T` or `kubectl describe pod` that zero `OOMKilled` terminations occur and container RSS stays well beneath cgroup ceilings.",
    "date": "2026-09-05",
    "id": 1788592443,
    "type": "error"
});