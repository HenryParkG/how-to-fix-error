window.onPostDataLoaded({
    "title": "Mitigate Redis Fork Latency & Copy-on-Write OOM",
    "slug": "redis-fork-latency-cow-memory-exhaustion-bgsave",
    "language": "Docker",
    "code": "MISCONF / OOMKilled",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Redis snapshotting via <code>BGSAVE</code> or background AOF rewrites (<code>BGREWRITEAOF</code>) relies on the POSIX <code>fork()</code> system call. During <code>fork()</code>, the kernel duplicates the parent process page tables to initialize the child process. Although memory pages are marked as Copy-on-Write (CoW) rather than immediately duplicated, page table duplication itself requires CPU time proportional to the resident set size (RSS).</p><p>For instances exceeding 20GB of RAM, this page table traversal stalls the single-threaded Redis event loop, creating visible fork latency spikes of hundreds of milliseconds. Concurrently, if the host OS has Transparent Huge Pages (THP) enabled, any minor 4KB memory write to a key while the child process writes the RDB snapshot forces Linux to duplicate an entire 2MB huge page. Under heavy write workloads, this amplification causes the CoW memory overhead to spike violently, consuming all remaining RAM and triggering the Linux Out-Of-Memory (OOM) killer.</p>",
    "root_cause": "Blocking fork() overhead copying extensive page tables, compounded by Transparent Huge Pages (THP) duplicating 2MB pages on every CoW write mutation.",
    "bad_code": "# Default redis.conf with aggressive snapshotting under high write loads\nsave 900 1\nsave 300 10\nsave 60 10000\nstop-writes-on-bgsave-error yes\nrdbcompression yes\n\n# Container deployment without host kernel tuning\n# Linux host running with THP default:\n# $ cat /sys/kernel/mm/transparent_hugepage/enabled\n# [always] madvise never",
    "solution_desc": "Disable Transparent Huge Pages across the host OS to eliminate 2MB CoW page amplification. Configure Linux overcommit memory policy to <code>vm.overcommit_memory = 1</code> so the kernel safely permits allocation of the virtual address space. In Redis, limit write amplification during snapshots, offload backups to replicas, or adjust snapshot thresholds to off-peak periods.",
    "good_code": "# 1. Host Kernel Optimization (sysctl.conf / host provisioning)\necho \"never\" > /sys/kernel/mm/transparent_hugepage/enabled\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\nsysctl -p\n\n# 2. Optimized redis.conf settings\n# Disable automatic snapshots on primary nodes (delegate to replicas)\nsave \"\"\n\n# Prevent background saving stalls\nstop-writes-on-bgsave-error no\nrdbcompression yes\nrdbchecksum yes\n\n# Limit maximum physical memory to avoid container OOM thresholds\nmaxmemory 16gb\nmaxmemory-policy volatile-lru\n\n# Use diskless replication for streaming to replicas without disk fork overhead\nrepl-diskless-sync yes\nrepl-diskless-sync-delay 5",
    "verification": "Execute `redis-cli INFO stats` and monitor the `latest_fork_usec` metric; it should remain below 15000 microseconds (15ms). Check `cat /proc/sys/vm/overcommit_memory` returns `1` and host `dmesg -T` shows no OOM invocation on `redis-server`.",
    "date": "2026-09-24",
    "id": 1790216228,
    "type": "error"
});