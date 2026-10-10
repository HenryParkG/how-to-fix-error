window.onPostDataLoaded({
    "title": "Mitigating Redis BGSAVE CoW Memory Bloat & Latency",
    "slug": "redis-bg-save-cow-memory-bloat-tail-latency",
    "language": "Docker",
    "code": "OOMKilled",
    "tags": [
        "Docker",
        "AWS",
        "Redis",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>When Redis creates an RDB snapshot or compacts an Append Only File via <code>BGSAVE</code> or <code>BGREWRITEAOF</code>, it relies on the Linux <code>fork()</code> system call. The operating system utilizes Copy-on-Write (CoW) to share physical memory pages between the parent Redis server and the child background worker. Ideally, memory overhead remains minimal because unmodified pages are shared.</p><p>However, under write-heavy workloads, any mutation to an existing key forces the Linux kernel to allocate a new physical memory page to handle the write. If Transparent Huge Pages (THP) is enabled in the host OS, the kernel will duplicate entire 2MB memory blocks instead of standard 4KB pages for every single mutation. This triggers exponential memory bloat, causing the Linux Out-Of-Memory (OOM) Killer to terminate the Redis process, alongside extreme tail-latency (p99/p999) spikes on the main thread during page table traversal.</p>",
    "root_cause": "Transparent Huge Pages (THP) coupled with high write throughput during fork() operations duplicates memory at 2MB page granularities, causing resident set size (RSS) to exceed host limits.",
    "bad_code": "# Problematic Redis Docker run without system kernel adjustments\ndocker run -d \\\n  --name redis-primary \\\n  -m 8g \\\n  -p 6379:6379 \\\n  redis:7.2 \\\n  redis-server \\\n  --save 60 1000 \\\n  --appendonly yes",
    "solution_desc": "Disable Transparent Huge Pages at the OS kernel level, set overcommit_memory to 1, and offload BGSAVE snapshots to dedicated read-replicas so the primary write master never triggers fork operations under high write traffic.",
    "good_code": "# 1. Host Kernel Preparation (systemd or cloud-init):\necho never > /sys/kernel/mm/transparent_hugepage/enabled\nsysctl -w vm.overcommit_memory=1\n\n# 2. Redis Primary Configuration (redis.conf):\nsave \"\"                      # Disable automatic RDB saves on write-heavy master\nstop-writes-on-bgsave-error yes\nrdbcompression yes\n\n# 3. Offload snapshotting to a dedicated replica container:\n# Replica redis.conf:\nreplicaof primary.internal 6379\nsave 900 1\nsave 300 10\nsave 60 10000",
    "verification": "Check memory metrics using `redis-cli INFO memory` and verify that `mem_fragmentation_ratio` remains below 1.5 during background saves. Run `cat /sys/kernel/mm/transparent_hugepage/enabled` to verify `[never]` is active.",
    "date": "2026-10-10",
    "id": 1791602699,
    "type": "error"
});