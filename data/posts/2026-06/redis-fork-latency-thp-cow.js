window.onPostDataLoaded({
    "title": "Fixing Redis Fork Latency from THP Copy-on-Write",
    "slug": "redis-fork-latency-thp-cow",
    "language": "SQL",
    "code": "RedisLatencySpike",
    "tags": [
        "Redis",
        "Linux",
        "SQL",
        "Error Fix"
    ],
    "analysis": "<p>Redis operations are single-threaded and highly latency-sensitive. To persist data asynchronously, Redis relies on background saving operations (BGSAVE) and Append-Only File (AOF) rewriting. These operations call the Linux <code>fork()</code> system call to create a child process. This process shares memory pages with the parent process through Copy-on-Write (CoW).</p><p>When Transparent Huge Pages (THP) are enabled at the operating system level, Linux manages memory allocation using 2MB pages instead of the standard 4KB pages. During a BGSAVE operation, any single write to a Redis key forces the OS to copy the entire 2MB huge page containing that key, rather than a small 4KB page. This creates extreme write amplification, increases memory allocation delay inside the kernel, and results in severe spikes in application response latency during snapshot processes.</p>",
    "root_cause": "The OS-level configuration of Transparent Huge Pages (THP) forces Copy-on-Write (CoW) actions to duplicate entire 2MB pages instead of 4KB pages, leading to substantial allocation delays and CPU cache invalidations during Redis fork operations.",
    "bad_code": "# Verify the bad configuration setup on host or container start\n# Output showing THP is enabled and active:\n# cat /sys/kernel/mm/transparent_hugepage/enabled\n# [always] madvise never\n\n# Standard Redis configuration run under this system environment\n# will experience high 'latest_fork_usec' values during BGSAVE.",
    "solution_desc": "Disable Transparent Huge Pages at the OS kernel level prior to launching the Redis daemon. Also, set the virtual memory overcommit settings ('vm.overcommit_memory = 1') to prevent Redis fork operations from failing due to strict allocation checks, and instruct Redis to warm up memory correctly.",
    "good_code": "#!/bin/bash\n# Disabling Transparent Huge Pages dynamically\necho never > /sys/kernel/mm/transparent_hugepage/enabled\necho never > /sys/kernel/mm/transparent_hugepage/defrag\n\n# Configure overcommit to ensure fork allocations always succeed\nsysctl vm.overcommit_memory=1\n\n# Persist modifications across system reboots\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# Verify configuration before launching Redis\ncat /sys/kernel/mm/transparent_hugepage/enabled\n# Expected stdout: always madvise [never]",
    "verification": "Run a background snapshot command inside Redis (`redis-cli BGSAVE`) while executing a synthetic benchmarking tool like `redis-benchmark`. Monitor the system metrics and check latency output inside Redis: `redis-cli INFO stats | grep latest_fork_usec`. The fork duration should drop from hundreds of milliseconds to under 10-20ms.",
    "date": "2026-06-06",
    "id": 1780743001,
    "type": "error"
});