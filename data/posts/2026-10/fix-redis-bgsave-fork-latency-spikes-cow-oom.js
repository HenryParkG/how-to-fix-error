window.onPostDataLoaded({
    "title": "Fix Redis BGSAVE Fork Latency Spikes and CoW OOM",
    "slug": "fix-redis-bgsave-fork-latency-spikes-cow-oom",
    "language": "Redis",
    "code": "MISCONF / ForkLatency",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background persistence operation (<code>BGSAVE</code> or an append-only file rewrite <code>BGREWRITEAOF</code>), it invokes the Linux system call <code>fork()</code> to spawn a child process. The child process writes the memory snapshot to disk while the parent process continues serving client commands using OS-level Copy-on-Write (CoW).</p><p>This mechanism presents two severe vulnerabilities under heavy write loads: first, <code>fork()</code> requires duplicating the parent process's page table entries. For an instance with 32 GB of memory, page tables can consume over 64 MB, causing the <code>fork()</code> call to block Redis's single-threaded event loop for several hundred milliseconds. Second, if the master node undergoes significant write traffic during snapshotting, modified pages must be copied individually. If Linux Transparent Huge Pages (THP) are enabled, modifying a single byte requires duplicating an entire 2 MB page rather than a standard 4 KB page, multiplying CoW memory usage and triggering the kernel Out-Of-Memory (OOM) killer.</p>",
    "root_cause": "Aggressive fork-based snapshotting on instances with high write mutation rates causes execution stalls during page table duplication and memory exhaustion via Copy-on-Write amplification from Linux Transparent Huge Pages.",
    "bad_code": "# Problematic redis.conf configuration\nsave 900 1\nsave 300 10\nsave 60 10000\n\n# OS host with Transparent Huge Pages enabled (Default on many Linux distros)\n# $ cat /sys/kernel/mm/transparent_hugepage/enabled\n# [always] madvise never\n\n# vm.overcommit_memory left at default 0\n# $ sysctl vm.overcommit_memory\n# vm.overcommit_memory = 0",
    "solution_desc": "Disable Transparent Huge Pages across the host OS to eliminate 2 MB page CoW inflation. Set `vm.overcommit_memory = 1` so `fork()` succeeds without requiring duplicate virtual memory reservation. In production clusters with continuous mutations, disable automatic RDB snapshots (`save \"\"`) on write-heavy primary nodes, delegating persistence exclusively to dedicated read-replicas.",
    "good_code": "# 1. Apply kernel level tunings (host or container init)\nsysctl vm.overcommit_memory=1\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# 2. redis.conf for write-heavy primary\nsave \"\"\nstop-writes-on-bgsave-error yes\nrdbcompression yes\n\n# 3. Offload RDB snapshots to read replica redis.conf\nsave 900 1\nsave 300 100\nreplica-read-only yes",
    "verification": "Execute `redis-cli INFO persistence` and check `latest_fork_usec`. Confirm `fork` latency remains under 15,000 microseconds. Monitor `/sys/kernel/mm/transparent_hugepage/enabled` to verify `[never]` is active, and track `/proc/<redis_pid>/smaps` during snapshots to verify low Private_Dirty page consumption.",
    "date": "2026-10-17",
    "id": 1792240525,
    "type": "error"
});