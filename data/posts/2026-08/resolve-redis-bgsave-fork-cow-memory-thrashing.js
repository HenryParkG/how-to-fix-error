window.onPostDataLoaded({
    "title": "Resolve Redis BGSAVE Fork COW Thrashing & Latency",
    "slug": "resolve-redis-bgsave-fork-cow-memory-thrashing",
    "language": "Redis / Linux",
    "code": "MISCONF / Fork Stall",
    "tags": [
        "Docker",
        "Linux",
        "Redis",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs snapshotting via <code>BGSAVE</code> or background AOF rewrites, it relies on the Linux <code>fork()</code> system call. Under write-heavy workloads, Copy-on-Write (CoW) page duplication forces the OS to duplicate memory pages. If Transparent Huge Pages (THP) are enabled, the kernel copies 2MB pages instead of 4KB pages on every minor write, causing extreme memory amplification, Out-Of-Memory kills, and event loop stalls lasting hundreds of milliseconds.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) multiply Copy-on-Write memory footprint by 512x during child process dumps, while `vm.overcommit_memory=0` forces the kernel to perform strict page validation during fork, stalling the main event loop.",
    "bad_code": "# Problematic Linux Host Configuration\nsysctl vm.overcommit_memory=0\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Default unoptimized redis.conf with aggressive snapshotting\nsave 60 10000\nstop-writes-on-bgsave-error yes\nrdbcompression yes",
    "solution_desc": "Disable Transparent Huge Pages at boot time, set `vm.overcommit_memory = 1`, tune `rdb-save-incremental-fsync` to smooth disk I/O, and offload snapshot persistence to dedicated read replicas to avoid blocking writes on the primary node.",
    "good_code": "# 1. System-level Fix (apply on host or Docker host)\nsudo sysctl -w vm.overcommit_memory=1\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\n\n# 2. Redis Configuration (/etc/redis/redis.conf)\n# Disable aggressive local snapshots on primary node\nsave \"\"\nappendonly yes\nappendfsync everysec\nno-appendfsync-on-rewrite yes\nauto-aof-rewrite-percentage 100\nauto-aof-rewrite-min-size 64mb\nrdb-save-incremental-fsync yes\nlazyfree-lazy-eviction yes\nlazyfree-lazy-expire yes",
    "verification": "Inspect Redis runtime metrics using `redis-cli INFO persistence`. Verify that `latest_fork_usec` is under 20,000 microseconds and `rdb_last_cow_size` remains minimal during snapshot cycles.",
    "date": "2026-08-22",
    "id": 1787390367,
    "type": "error"
});