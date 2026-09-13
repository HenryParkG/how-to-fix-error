window.onPostDataLoaded({
    "title": "Redis BGSAVE: THP Stalls & Copy-on-Write Memory Bloat",
    "slug": "redis-bgsave-transparent-hugepages-cow-memory-bloat",
    "language": "Redis",
    "code": "OOMKilled",
    "tags": [
        "Redis",
        "Linux",
        "Docker",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers persistence via <code>BGSAVE</code> or background AOF rewriting, it invokes the POSIX <code>fork()</code> system call to create a child process. Linux relies on Copy-on-Write (CoW) semantics, sharing physical memory pages between the parent Redis process and child dumper until a modification occurs. If the parent handles writes while the snapshot is running, modified memory pages are duplicated.</p><p>When Linux Transparent Huge Pages (THP) is enabled, the kernel manages memory in 2MB continuous blocks instead of standard 4KB pages. Modifying even a single 1-byte key forces the kernel to duplicate an entire 2MB huge page, ballooning memory usage dynamically. Furthermore, memory compaction and synchronous page allocation under THP cause high latency spikes and engine stalls.</p>",
    "root_cause": "Kernel Transparent Huge Pages (THP) forces 2MB page granularity during fork-based Copy-on-Write operations, multiplying memory duplication rates by up to 512x and causing kernel compaction latency spikes.",
    "bad_code": "# Default / incorrect production host configuration\n# Kernel allocates 2MB huge pages dynamically\necho always > /sys/kernel/mm/transparent_hugepage/enabled\necho always > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Strict overcommit memory policy causing fork() failures\nsysctl vm.overcommit_memory=0",
    "solution_desc": "Explicitly disable Transparent Huge Pages at boot time and runtime via sysfs. Configure the Linux virtual memory subsystem to allow memory overcommit (`vm.overcommit_memory = 1`) to ensure fork() invocations do not fail when memory utilization is high. Monitor `rdb_last_cow_size` inside Redis to track memory delta during snapshots.",
    "good_code": "# 1. Runtime mitigation on host / node\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\nsysctl vm.overcommit_memory=1\n\n# 2. Persist in /etc/sysctl.d/99-redis.conf\n# vm.overcommit_memory = 1\n\n# 3. Add systemd unit to disable THP before Redis initializes\n# ExecStartPre=/bin/sh -c 'echo never > /sys/kernel/mm/transparent_hugepage/enabled'",
    "verification": "Check runtime status via `cat /sys/kernel/mm/transparent_hugepage/enabled` and ensure `[never]` is bracketed. Run `redis-cli INFO persistence` while executing write traffic during a `BGSAVE` and verify that `rdb_last_cow_size` remains proportional to actual mutated keys instead of jumping in 2MB increments.",
    "date": "2026-09-13",
    "id": 1789265272,
    "type": "error"
});