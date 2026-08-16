window.onPostDataLoaded({
    "title": "Mitigating Redis BGSAVE Fork Spikes & THP Memory Bloat",
    "slug": "redis-bgsave-fork-latency-thp-bloat",
    "language": "Docker",
    "code": "LatencySpike",
    "tags": [
        "Docker",
        "AWS",
        "Error Fix"
    ],
    "analysis": "<p>When Redis executes <code>BGSAVE</code> or initiates a replication sync, it calls <code>fork()</code> to spawn a child process. On systems where Transparent Huge Pages (THP) is enabled, the Linux kernel duplicates 2MB memory pages instead of 4KB pages during Copy-on-Write (CoW). Under moderate-to-heavy write workloads, this amplifies memory consumption by orders of magnitude, causing latency spikes and potential OOM kills.</p>",
    "root_cause": "Linux Transparent Huge Pages (THP) forces 2MB page granularity during memory-page copying on write operations. When Redis modifies a single key in memory during a background save, the kernel is forced to duplicate entire 2MB huge pages, saturating memory bandwidth and multiplying memory consumption.",
    "bad_code": "# Problematic system configuration with THP enabled and default Redis overcommit\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n# Container startup without host memory management\ndocker run -d --name redis-prod \\\n  -p 6379:6379 \\\n  redis:7.2 redis-server --save 60 1000",
    "solution_desc": "Disable Transparent Huge Pages at the host kernel level, enable memory overcommit (`vm.overcommit_memory = 1`), and configure Redis to use a less aggressive snapshot policy alongside a non-blocking snapshot approach.",
    "good_code": "# 1. Disable THP and configure memory overcommit on the host/node\nsudo sysctl vm.overcommit_memory=1\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Run Redis with optimized memory constraints and systemd/docker config\ndocker run -d --name redis-prod \\\n  --sysctl net.core.somaxconn=1024 \\\n  -v /sys/kernel/mm/transparent_hugepage:/sys/kernel/mm/transparent_hugepage:ro \\\n  -p 6379:6379 \\\n  redis:7.2 redis-server \\\n  --maxmemory 8gb \\\n  --maxmemory-policy volatile-lru \\\n  --save 900 1 \\\n  --rdbcompression yes \\\n  --rdbchecksum yes",
    "verification": "Run `redis-cli INFO stats` and verify `latest_fork_usec` stays below 10,000 microseconds (10ms). Check `cat /sys/kernel/mm/transparent_hugepage/enabled` to ensure `never` is selected.",
    "date": "2026-08-16",
    "id": 1786861400,
    "type": "error"
});