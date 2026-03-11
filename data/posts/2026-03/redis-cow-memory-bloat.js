window.onPostDataLoaded({
    "title": "Mitigating Redis Copy-on-Write Memory Bloat during BGSAVE",
    "slug": "redis-cow-memory-bloat",
    "language": "Redis",
    "code": "MemoryExhaustion",
    "tags": [
        "SQL",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>Redis uses the <code>fork()</code> system call to perform background snapshots (BGSAVE). This relies on Copy-on-Write (CoW). Initially, the child process shares all memory pages with the parent. However, every write to the parent Redis process during the snapshot forces a page copy.</p><p>On systems with 'Transparent Huge Pages' (THP) enabled, even a small 1KB write can force a 2MB page copy, leading to massive memory bloat that can trigger the OOM killer.</p>",
    "root_cause": "High write volume during BGSAVE combined with Linux Transparent Huge Pages (THP), which increases the granularity of memory copies.",
    "bad_code": "# Standard aggressive persistence config\nsave 60 10000\n# System setting (Bad for Redis)\necho always > /sys/kernel/mm/transparent_hugepage/enabled",
    "solution_desc": "Disable Transparent Huge Pages (THP) at the OS level to reduce CoW granularity to 4KB. Also, ensure 'overcommit_memory' is set to 1 to allow the kernel to allocate the virtual memory required for the fork.",
    "good_code": "# Disable THP\necho never > /sys/kernel/mm/transparent_hugepage/enabled\n# Set overcommit\necho 1 > /proc/sys/vm/overcommit_memory\n# Redis Config\nCONFIG SET save \"\"",
    "verification": "Run 'INFO memory' during a BGSAVE and monitor 'rdb_last_cow_size'. It should be significantly lower with THP disabled.",
    "date": "2026-03-11",
    "id": 1773211259,
    "type": "error"
});