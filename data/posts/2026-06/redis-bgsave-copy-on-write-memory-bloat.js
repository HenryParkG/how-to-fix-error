window.onPostDataLoaded({
    "title": "Fixing Redis BGSAVE Copy-on-Write Memory Bloat",
    "slug": "redis-bgsave-copy-on-write-memory-bloat",
    "language": "Docker",
    "code": "OOM Killer (SIGKILL)",
    "tags": [
        "Docker",
        "Redis",
        "Infra",
        "Sysadmin",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots (BGSAVE) or AOF rewrites (BGREWRITEAOF), it forks a child process to serialize memory to disk. Linux uses Copy-on-Write (CoW) optimization: the parent and child processes initially share the same physical memory pages. However, any write operation on the Redis parent process forces the kernel to duplicate the modified page. In write-heavy production workloads, this causes massive memory replication. If Transparent Huge Pages (THP) are enabled, the system copies 2MB pages instead of standard 4KB pages, exponentially increasing the memory footprint and triggering Linux Out-Of-Memory (OOM) killer terminations.</p>",
    "root_cause": "Transparent Huge Pages (THP) force Linux to allocate 2MB physical memory pages. During a fork-based BGSAVE, even a tiny 1-byte write triggers the copying of an entire 2MB block, bloating memory utilization by up to 512x compared to standard 4KB pages.",
    "bad_code": "# Default container initialization showing typical system state vulnerability\nFROM redis:7.0-alpine\n# THP is often enabled on the host machine by default, and memory overcommit\n# configuration is left unoptimized, causing catastrophic memory spikes on BGSAVE.\nCMD [\"redis-server\", \"--save\", \"60\", \"1000\"]",
    "solution_desc": "Configure host-level kernel settings to disable Transparent Huge Pages (THP) and enable memory overcommit ('vm.overcommit_memory = 1'). In your application configurations, optimize the Redis replication buffers, or schedule snapshotting during low-traffic periods to minimize the write frequency during active forks.",
    "good_code": "#!/bin/bash\n# Host-level mitigation script to prevent CoW memory bloat\n\n# 1. Enable memory overcommit to allow fork allocations to succeed\nsudo sysctl vm.overcommit_memory=1\n\n# 2. Disable Transparent Huge Pages (THP) system-wide\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag\n\n# 3. Apply changes inside the Docker deployment or directly to host\n# Start Redis with safe memory limit boundaries to avoid triggering system limits\nredis-server --maxmemory 4gb --maxmemory-policy allkeys-lru --save \"\"",
    "verification": "Trigger a manual snapshot with 'redis-cli BGSAVE' while running a high-throughput write load. Monitor '/proc/sys/vm/overcommit_memory' and ensure that memory consumption does not spike significantly beyond the normal baseline.",
    "date": "2026-06-14",
    "id": 1781404992,
    "type": "error"
});