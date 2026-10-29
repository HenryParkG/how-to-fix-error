window.onPostDataLoaded({
    "title": "Mitigating Redis BGSAVE Copy-on-Write Latency Spikes",
    "slug": "redis-mitigating-bgsave-cow-memory-fork-latency",
    "language": "Redis",
    "code": "ERR_FORK_OOM_LATENCY",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs point-in-time snapshots via <code>BGSAVE</code> or background AOF rewrites (<code>BGREWRITEAOF</code>), it invokes the Linux system call <code>fork()</code>. During this invocation, the operating system creates a child process that duplicates the parent's memory page tables rather than allocating new physical memory immediately, leveraging Copy-on-Write (CoW).</p><p>Under sustained high-write workloads, every write command touching a memory page forces the kernel to copy that 4KB page (or 2MB Transparent Huge Page) before modifying it. When Transparent Huge Pages (THP) are enabled, write amplification skyrockets from 4KB to 2MB per modification, rapidly exhausting memory buffers, triggering the Linux OOM killer, and introducing millisecond-to-second latency spikes that block Redis's single-threaded event loop during the page table allocation phase.</p>",
    "root_cause": "Linux fork() latency is proportional to memory size and page table count. When Transparent Huge Pages (THP) are active, any memory mutation triggers 2MB CoW allocations instead of 4KB pages, causing severe write amplification, paging saturation, and event loop blocking.",
    "bad_code": "# Default / dangerous kernel setup with aggressive periodic snapshotting\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\n# redis.conf with aggressive snapshotting on high-write systems\nsave 60 100000\nstop-writes-on-bgsave-error yes\nrdbcompression yes",
    "solution_desc": "Disable Transparent Huge Pages at the OS level to force 4KB granular page copies, configure overcommit handling, increase the fork margin via replica-based snapshots, or transition persistence to non-blocking AOF with controlled incremental fsync.",
    "good_code": "# 1. Disable THP and configure sysctl parameters\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\nsysctl net.core.somaxconn=1024\n\n# 2. Optimized redis.conf settings\n# Offload snapshots to dedicated read replicas; disable BGSAVE on master:\nsave \"\"\n\n# Use AOF with incremental fsync to avoid disk burst saturation\nappendonly yes\nappendfsync everysec\nno-appendfsync-on-rewrite yes\naof-use-rdb-preamble yes",
    "verification": "Check Redis latency telemetry with `redis-cli --latency` and monitor `info persistence` to inspect `latest_fork_usec` and `rdb_last_cow_size`. Ensure fork durations drop below 15ms and CoW memory overhead aligns closely with the actual delta of writes.",
    "date": "2026-10-29",
    "id": 1793275590,
    "type": "error"
});