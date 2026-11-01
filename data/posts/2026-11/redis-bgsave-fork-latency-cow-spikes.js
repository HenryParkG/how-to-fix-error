window.onPostDataLoaded({
    "title": "Resolve Redis BGSAVE Fork Latency & CoW Spikes",
    "slug": "redis-bgsave-fork-latency-cow-spikes",
    "language": "Redis",
    "code": "ForkLatencyMemorySpike",
    "tags": [
        "Redis",
        "Linux",
        "Performance",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers snapshot persistence (<code>BGSAVE</code>) or append-only file rewriting (<code>BGREWRITEAOF</code>), the main thread invokes the Linux kernel <code>fork()</code> system call to create a background child process. During this operation, the kernel must duplicate the main process's page table entries.</p><p>If memory is fragmented or Transparent Huge Pages (THP) is enabled, this copy-on-write (CoW) allocation can stall the main event loop for hundreds of milliseconds. Furthermore, as Redis modifies keys during the snapshot lifecycle, THP forces the kernel to copy entire 2MB memory blocks rather than 4KB standard pages, causing massive memory spikes that often trigger the Linux Out-Of-Memory (OOM) killer.</p>",
    "root_cause": "Kernel page-table duplication latency during fork() exacerbated by Transparent Huge Pages (THP) converting small writes into 2MB page-copy operations under write-heavy workloads.",
    "bad_code": "# Default / Host misconfigurations leading to fork latency and memory exhaustion\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n$ sysctl vm.overcommit_memory\nvm.overcommit_memory = 0\n\n# redis.conf aggressive snapshotting under high write QPS\nsave 60 10000\nstop-writes-on-bgsave-error yes",
    "solution_desc": "Disable Transparent Huge Pages at boot time, set Linux virtual memory overcommit to 1, and fine-tune Redis save triggers to avoid frequent background forks during peak hours.",
    "good_code": "# 1. Apply system kernel tunings\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\nsysctl -p\n\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Redis Configuration Adjustments (redis.conf)\n# Disable aggressive automated snapshots during production peak\nsave \"\"\n\n# Enable fork-less replication streaming if operating with replicas\nrepl-diskless-sync yes\nrepl-diskless-sync-delay 5\n\n# Set threshold for warning on slow child processes\nlatency-monitor-threshold 20",
    "verification": "Execute `INFO persistence` and monitor `latest_fork_usec`. Confirm fork duration remains below 15,000 microseconds. Inspect memory during BGSAVE via `INFO memory` to confirm `mem_fragmentation_ratio` and CoW memory overhead remain constrained.",
    "date": "2026-11-01",
    "id": 1793535866,
    "type": "error"
});