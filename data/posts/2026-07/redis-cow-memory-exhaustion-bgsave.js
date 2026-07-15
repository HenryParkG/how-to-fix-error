window.onPostDataLoaded({
    "title": "Fixing Redis Copy-On-Write Memory Exhaustion",
    "slug": "redis-cow-memory-exhaustion-bgsave",
    "language": "Redis",
    "code": "OOMSpike",
    "tags": [
        "Redis",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Redis performs background snapshots via BGSAVE or replication, it forks a child process. Linux relies on Copy-on-Write (COW) to share physical memory pages. If Redis experiences a high volume of write commands during this time, many memory pages are modified, forcing the OS to duplicate those pages. This can double the memory usage of the host, leading to out-of-memory (OOM) termination of Redis or massive latency spikes due to swap activity.</p>",
    "root_cause": "Misconfigured kernel overcommit settings causing fork failures, or insufficient memory headroom to accommodate the volume of modified pages during copy-on-write.",
    "bad_code": "# BUG: Redis system configuration and sysctl settings that exacerbate COW issues\nsysctl vm.overcommit_memory=0\n# Redis config allowing high save frequency with high write loads\nsave 60 10000",
    "solution_desc": "Configure the Linux kernel to allow memory overcommit, ensure adequate swap space, and schedule writes or BGSAVE during low-activity windows to minimize modified pages.",
    "good_code": "# FIX: Enable memory overcommit to allow fork() to succeed even under tight memory\nsysctl vm.overcommit_memory=1\necho \"vm.overcommit_memory = 1\" >> /etc/sysctl.conf\n\n# In redis.conf, adjust save points or use active active-defrag controls\n# active-defrag yes",
    "verification": "Monitor memory usage with `INFO memory` and inspect the `latest_fork_usec` and `mem_fragmentation_ratio` metrics during BGSAVE.",
    "date": "2026-07-15",
    "id": 1784092993,
    "type": "error"
});