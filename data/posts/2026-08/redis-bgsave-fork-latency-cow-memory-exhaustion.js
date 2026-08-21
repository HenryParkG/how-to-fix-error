window.onPostDataLoaded({
    "title": "Fix Redis BGSAVE Fork Latency & COW Memory Spikes",
    "slug": "redis-bgsave-fork-latency-cow-memory-exhaustion",
    "language": "Redis",
    "code": "OOM_KILLED_COW_SPIKE",
    "tags": [
        "Docker",
        "AWS",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>When Redis executes snapshotting via <code>BGSAVE</code> or during <code>BGREWRITEAOF</code>, it relies on the Linux <code>fork()</code> system call to create a background child process. While <code>fork()</code> uses Copy-on-Write (COW) to avoid duplicating entire memory pages upfront, high-throughput write workloads modify vast numbers of existing memory pages while the snapshot is running. Consequently, the OS kernel must rapidly duplicate modified pages, doubling the memory footprint and triggering Linux Out-Of-Memory (OOM) killer terminations.</p><p>Furthermore, allocating page tables for multi-gigabyte memory spaces during <code>fork()</code> can block Redis's single-threaded event loop for hundreds of milliseconds, leading to application-level timeout cascades and connection drops.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) allocating 2MB blocks on write faults instead of 4KB pages during COW, paired with running intensive background snapshots directly on high-write master instances with strict kernel memory limits (vm.overcommit_memory=0).",
    "bad_code": "# Default /etc/redis/redis.conf on high-write Master node\nsave 900 1\nsave 300 10\nsave 60 10000\n\n# System kernel defaults left unconfigured:\n# /sys/kernel/mm/transparent_hugepage/enabled -> [always]\n# /proc/sys/vm/overcommit_memory -> 0",
    "solution_desc": "Architecturally eliminate COW spikes by: (1) disabling Transparent Huge Pages to prevent 2MB page amplification on COW writes, (2) setting kernel memory overcommit to 1, and (3) offloading snapshotting (RDB) and AOF rewrites entirely to a dedicated read-only replica while disabling disk snapshots on the primary.",
    "good_code": "# 1. Apply Linux OS Kernel Optimizations\necho 'never' > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl -w vm.overcommit_memory=1\n\n# 2. Configure Primary Redis Instance (redis-master.conf)\nsave \"\"\nappendonly no\n\n# 3. Configure Replica Redis Instance (redis-replica.conf)\nreplicaof 10.0.0.1 6379\nsave 300 10\nappendonly yes\nappendfilename \"appendonly.aof\"\nappendfsync everysec",
    "verification": "Inspect Redis stats using `redis-cli INFO stats` to verify that `latest_fork_usec` drops below 20,000 microseconds (20ms), and query `redis-cli INFO persistence` to confirm `rdb_last_bgsave_status:ok` with stable memory RSS throughout peak write traffic.",
    "date": "2026-08-21",
    "id": 1787273066,
    "type": "error"
});