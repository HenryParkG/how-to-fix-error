window.onPostDataLoaded({
    "title": "Fixing Redis CoW Memory Bloat and Latency",
    "slug": "fixing-redis-cow-memory-bloat-and-latency",
    "language": "Redis / Bash",
    "code": "OOM_KILLED_COW_SPIKE",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers a background snapshot (<code>BGSAVE</code>) or performs a replication synchronization, it spawns a child process using the system's <code>fork()</code> call. The operating system utilizes Copy-on-Write (CoW) optimization to share physical memory pages between the parent process and the child process, conserving memory.</p><p>However, if the database is subjected to a heavy write workload during the lifetime of the <code>BGSAVE</code> process, Linux must copy pages that the parent modifies to maintain data consistency. If Transparent Huge Pages (THP) is active, Linux copies 2MB memory blocks instead of the standard 4KB pages. This massive page copying granularity results in extreme memory overhead (CoW memory bloat), hitting OS memory limits, causing the kernel to trigger the OOM killer, and introducing painful CPU-bound latency spikes.</p>",
    "root_cause": "Enabled Transparent Huge Pages (THP) on the host kernel causing 2MB memory allocations per write instead of standard 4KB allocations during fork-based operations.",
    "bad_code": "# Insufficient host settings triggering CoW bloat\n# Check system parameters that are typically misconfigured:\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Output: [always] madvise never\n\nsysctl vm.overcommit_memory\n# Output: vm.overcommit_memory = 0",
    "solution_desc": "Architectural remedy involves configuring the host OS to disable Transparent Huge Pages (THP), adjusting kernel memory overcommit strategies, and tuning Redis save thresholds. This guarantees that page allocation sizes remain at 4KB during high write workloads, significantly reducing the write amplification overhead.",
    "good_code": "# Configure host operating system dynamically & persistently\n\n# 1. Disable Transparent Huge Pages immediately\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Adjust VM overcommit setting to allow Redis fork allocations\nsysctl vm.overcommit_memory=1\n\n# 3. Add parameters to /etc/sysctl.conf for persistent reboots\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# 4. In Redis config, ensure latency tracking and active-defrag parameters\n# redis.conf:\n# latency-monitor-threshold 100\n# activedefrag yes",
    "verification": "Execute `redis-cli BGSAVE` under write load and inspect the output of `INFO persistence`. Verify that the `mem_cow_size` metric remains in the low megabytes range and monitor slow logs using `redis-cli slowlog get` to ensure no spikes over 50ms occur.",
    "date": "2026-07-13",
    "id": 1783907563,
    "type": "error"
});