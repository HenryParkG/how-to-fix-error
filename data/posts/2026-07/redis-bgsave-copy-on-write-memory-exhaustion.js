window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE Copy-on-Write OOM",
    "slug": "redis-bgsave-copy-on-write-memory-exhaustion",
    "language": "Redis / Bash",
    "code": "OOM-Killed",
    "tags": [
        "Redis",
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots (BGSAVE) or Append Only File rewrites (BGREWRITEAOF), it uses the <code>fork()</code> system call to spin up a child process. The child process reads the dataset memory using Copy-on-Write (CoW). Under highly write-intensive production workloads, the parent process continuously modifies memory pages. This triggers operating system-level copying of dirty pages. If memory allocator fragmentation is high or if Huge Pages are enabled, physical RAM requirements spike dramatically, exceeding system limits and resulting in the Linux OOM-killer terminating Redis.</p>",
    "root_cause": "The Linux system is misconfigured with 'overcommit_memory = 0' (denying allocation request safety margins on forks), and Transparent Huge Pages (THP) are enabled. When THP is active, the OS forces Copy-on-Write to duplicate entire 2MB memory blocks instead of standard 4KB pages, vastly compounding memory consumption during writes.",
    "bad_code": "# Run-time system profile containing unsafe configurations\nsysctl vm.overcommit_memory=0\n\n# Transparent Huge Pages enabled (causes large 2MB CoW page duplication)\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Redis configuration with aggressive RDB saves during heavy traffic\n# save 60 10000",
    "solution_desc": "Configure the Linux kernel's virtual memory subsystem to allow memory overcommit by setting 'vm.overcommit_memory = 1'. Additionally, completely disable Transparent Huge Pages (THP) to restrict Copy-on-Write page allocations to small, precise 4KB fragments instead of large 2MB blocks. Finally, configure proper redis limits or deploy incremental persistence engines.",
    "good_code": "#!/usr/bin/env bash\nset -euo pipefail\n\n# Fix: Configure kernel memory allocation policies to allow overcommit\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# Fix: Disable Transparent Huge Pages to prevent huge CoW chunks\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Fix: Persist THP settings across reboots via boot configuration or cron\n# Add to crontab: @reboot echo never > /sys/kernel/mm/transparent_hugepage/enabled",
    "verification": "Verify overcommit configurations by executing `sysctl vm.overcommit_memory`. Check if THP is disabled with `cat /sys/kernel/mm/transparent_hugepage/enabled` (it should display `[never]`). Trigger a snapshot manually using `redis-cli BGSAVE` and monitor `info persistence` and container memory consumption.",
    "date": "2026-07-11",
    "id": 1783755692,
    "type": "error"
});