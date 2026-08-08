window.onPostDataLoaded({
    "title": "Fixing Redis Copy-on-Write OOM Panics During Snapshots",
    "slug": "fixing-redis-cow-oom-panics-rdb-snapshots",
    "language": "Redis",
    "code": "OOM Command Not Allowed",
    "tags": [
        "Redis",
        "Docker",
        "Linux",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When Redis triggers an RDB background snapshot (<code>BGSAVE</code>) or an AOF rewrite, it forks a child process using Linux's Copy-on-Write (CoW) memory mechanism. Under write-heavy workloads, any mutation to a memory page forces the OS to copy that entire 4KB page into memory for the parent process. If Redis system memory allocation is too close to system limits, these rapid CoW allocations cause sudden host memory spikes, resulting in Linux Kernel OOM killer panics or Redis returning <code>MISCONF / OOM command not allowed</code> errors.</p>",
    "root_cause": "High write concurrency during BGSAVE mutates memory pages rapidly, forcing Linux Copy-on-Write memory usage to double allocated heap memory while THP (Transparent Huge Pages) exacerbates allocation sizes from 4KB to 2MB per write.",
    "bad_code": "# Default vulnerable Redis / OS settings under write heavy loads\n# /etc/redis/redis.conf\nmaxmemory 14gb # Configured on a 16gb system without headroom for CoW!\n\n# System environment defaults (Vulnerable to severe CoW multiplier):\n# sysctl vm.overcommit_memory = 0\n# echo always > /sys/kernel/mm/transparent_hugepage/enabled",
    "solution_desc": "Configure Linux memory overcommit (`vm.overcommit_memory = 1`), completely disable Transparent Huge Pages (THP) to avoid 2MB allocation overhead on single byte writes, and limit Redis `maxmemory` to roughly 65-70% of available host RAM to reserve memory space for snapshot Copy-on-Write buffers.",
    "good_code": "# 1. Set Kernel memory overcommit policy\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# 2. Disable Transparent Huge Pages (THP) to decrease CoW page allocation size\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n\n# 3. Redis configuration fix (/etc/redis/redis.conf)\n# Set maxmemory to 65% of total system RAM (e.g. 10GB on 16GB total RAM host)\nmaxmemory 10gb\nmaxmemory-policy volatile-lru",
    "verification": "Trigger `BGSAVE` under heavy key mutating workloads using `redis-benchmark`. Run `INFO persistence` and check `latest_cow_bytes`. Verify that host memory stays below threshold and `OOM command not allowed` errors disappear.",
    "date": "2026-08-08",
    "id": 1786150540,
    "type": "error"
});