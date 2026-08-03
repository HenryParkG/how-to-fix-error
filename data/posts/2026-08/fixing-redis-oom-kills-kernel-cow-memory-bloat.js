window.onPostDataLoaded({
    "title": "Fix Redis OOM Kills During RDB Snapshots & Kernel CoW",
    "slug": "fixing-redis-oom-kills-kernel-cow-memory-bloat",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "Kubernetes",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background RDB snapshots or AOF rewrites, it calls <code>fork()</code> to create a child process. Linux relies on Copy-on-Write (CoW) to share memory pages between the parent and child processes.</p><p>If Redis receives a high rate of write operations during this snapshot window, or if Kernel Transparent Huge Pages (THP) is enabled, the OS allocates new 2MB memory pages even for single-byte writes. This creates massive memory amplification (CoW bloat), quickly exceeding cgroup memory limits and triggering Linux kernel OOM killer mechanisms.</p>",
    "root_cause": "Enabled Transparent Huge Pages (THP) causing 2MB page allocations per write during fork CoW, coupled with improper cgroup memory limit settings relative to Redis maxmemory.",
    "bad_code": "# Linux Host Config / Docker Startup script\n# THP enabled by default in many kernel distributions\necho always > /sys/kernel/mm/transparent_hugepage/enabled\n\n# Redis redis.conf setting without buffer allowance for CoW\n# If total container limit is 8GB:\nmaxmemory 7.8gb\nmaxmemory-policy allkeys-lru",
    "solution_desc": "Disable Transparent Huge Pages (THP) on the host kernel, set vm.overcommit_memory = 1, and set Redis maxmemory to 60-70% of the cgroup/container memory limit to reserve explicit overhead for CoW allocations during background persistence.",
    "good_code": "# Sysctl and Host Kernel Setup (run on host or init container)\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl vm.overcommit_memory=1\n\n# Redis redis.conf tuned for cgroup container with 8GB RAM limit\nmaxmemory 5gb\nmaxmemory-policy volatile-lru\nrdbcompression yes",
    "verification": "Trigger manual BGSAVE under heavy write load using redis-benchmark and monitor cgroup RSS via /sys/fs/cgroup/memory/memory.stat to confirm memory footprint remains below limits.",
    "date": "2026-08-03",
    "id": 1785722073,
    "type": "error"
});