window.onPostDataLoaded({
    "title": "Resolving Redis BGSAVE Fork Spikes & THP Cascades",
    "slug": "redis-bgsave-fork-latency-thp-memory",
    "language": "Redis",
    "code": "ForkLatencySpike",
    "tags": [
        "Redis",
        "Memory",
        "Linux",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Redis handles persistence using background snapshots (<code>BGSAVE</code>) or AOF rewrites, both of which invoke the Linux <code>fork()</code> system call. Although <code>fork()</code> uses Copy-on-Write (CoW) to avoid copying all physical memory immediately, the operating system must still duplicate the parent process page tables.</p><p>When Linux Transparent Huge Pages (THP) is enabled, the memory allocation granularity switches from 4KB pages to 2MB contiguous blocks. Under high write throughput, modifying a single key forces the kernel to copy an entire 2MB page rather than a 4KB page. This creates massive memory write amplification, depletes host RAM, and spikes `fork()` execution time to several seconds, blocking Redis from serving requests.</p>",
    "root_cause": "Transparent Huge Pages (THP) forces 2MB page duplication during Copy-on-Write snapshots, amplifying memory allocation overhead and stalling Redis's single-threaded event loop during page table replication.",
    "bad_code": "# Current system configuration causing latency spikes:\n$ cat /sys/kernel/mm/transparent_hugepage/enabled\n[always] madvise never\n\n# redis.conf with aggressive snapshotting under high write loads\nsave 60 100000\nstop-writes-on-bgsave-error yes\nrdbcompression yes",
    "solution_desc": "Disable Transparent Huge Pages at the OS kernel level and configure memory overcommit to prevent allocation failures. Tune Redis persistence to balance snapshot intervals, or offload RDB snapshot generation entirely to a dedicated read-replica instance.",
    "good_code": "# 1. Disable THP and set overcommit memory on the host system\nsudo sysctl vm.overcommit_memory=1\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled\necho never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag\n\n# 2. Persist settings across reboots via /etc/rc.local or sysctl.d\n# In redis.conf:\n# Lower fork frequency; delegate snapshots to replica or off-peak hours\nsave 900 1\nsave 300 10\nno-appendfsync-on-rewrite yes",
    "verification": "Query `redis-cli INFO persistence` and check `latest_fork_usec`. Confirm `latest_fork_usec` drops from hundreds of milliseconds to under 15,000 microseconds, and verify kernel THP state returns `always madvise [never]`.",
    "date": "2026-10-15",
    "id": 1792072095,
    "type": "error"
});