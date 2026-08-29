window.onPostDataLoaded({
    "title": "Fixing Linux Cgroup v2 OOM Thrashing & Limit Issues",
    "slug": "linux-cgroup-oom-killer-thrashing-memory-limits",
    "language": "Docker",
    "code": "OOMKilled / MemoryPressure",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When containerized workloads run under memory pressure with improperly configured Cgroup v2 boundaries, Linux kernel page reclaim enters synchronous direct reclaim loops. This results in heavy I/O thrashing on swap/dirty cache and triggers erratic OOM Killer invocations that terminate random sibling processes inside the cgroup tree.</p><p>By establishing precise hierarchical limits using <code>memory.high</code> as a proactive throttling boundary and reserving headroom with <code>memory.low</code> and <code>memory.min</code>, you prevent the kernel from executing aggressive synchronous drops that induce latency spikes.</p>",
    "root_cause": "The container hard ceiling (memory.max) was set without soft limits (memory.high) or swap configuration, causing the kernel to rapidly oscillate between page cache purge and synchronous direct reclaim when page allocations spike, resulting in severe CPU stall and sudden SIGKILL termination.",
    "bad_code": "# Problematic systemd / raw cgroup v2 configuration without throttling\necho \"512M\" > /sys/fs/cgroup/prod-worker/memory.max\n# memory.high and memory.low left at defaults (0 and max)\n# No swap configured: kernel has zero swap margin for anonymous pages\necho \"0\" > /sys/fs/cgroup/prod-worker/memory.swap.max",
    "solution_desc": "Configure Cgroup v2 memory hierarchy with progressive tiers: set memory.min for protected working sets, memory.low for proportional reclamation, memory.high for asynchronous throttle notification, and limit memory.max only as a safety ceiling. Enable PSI (Pressure Stall Information) monitoring to trigger horizontal autoscaling before hard limits are reached.",
    "good_code": "# Proper Cgroup v2 setup with proactive throttling boundaries\nCGROUP_PATH=\"/sys/fs/cgroup/prod-worker\"\n\n# Protected working set (guaranteed from reclaim)\necho \"256M\" > ${CGROUP_PATH}/memory.min\n\n# Soft reclaim target (throttles processes via sleep injection)\necho \"450M\" > ${CGROUP_PATH}/memory.high\n\n# Hard OOM threshold ceiling\necho \"512M\" > ${CGROUP_PATH}/memory.max\n\n# Provide small swap cushion to prevent instant killer triggering\necho \"128M\" > ${CGROUP_PATH}/memory.swap.max",
    "verification": "Check pressure stall information using `cat /sys/fs/cgroup/prod-worker/memory.pressure` and verify that `some` and `full` stalls remain low without any `oom_kill` increments in `memory.events`.",
    "date": "2026-08-29",
    "id": 1787979216,
    "type": "error"
});