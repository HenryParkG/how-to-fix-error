window.onPostDataLoaded({
    "title": "Resolving Cgroup v2 Memory Accounting Discrepancies",
    "slug": "cgroup-v2-memory-accounting-fix",
    "language": "C",
    "code": "SystemError",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-density Kubernetes nodes using Cgroup v2, operators often notice a discrepancy where `memory.current` is significantly higher than the RSS reported by the application. This is frequently caused by kernel slab fragmentation and the way Cgroup v2 accounts for 'dying' memory cgroups and cached pages that are not being evicted aggressively enough under high-density pressures.</p>",
    "root_cause": "The kernel fails to reclaim 'ghost' slab caches associated with deleted containers or transient tasks, leading to inflated memory usage metrics in the parent cgroup.",
    "bad_code": "# Default behavior often leads to high 'inactive_file' usage\ncat /sys/fs/cgroup/system.slice/memory.current\n# 10GB (while app uses only 2GB RSS)",
    "solution_desc": "Adjust the kernel's pressure stall information (PSI) handling and enable proactive memory reclamation. Specifically, tuning 'memory.reclaim' (available in kernels 5.19+) or using 'memory.high' to trigger softer throttling before the OOM killer is invoked.",
    "good_code": "# Proactively reclaim 1GB of memory from the cgroup to clear caches\necho \"1G\" > /sys/fs/cgroup/my-container/memory.reclaim\n\n# Adjust memory.high to trigger background reclaim\necho \"2G\" > /sys/fs/cgroup/my-container/memory.high",
    "verification": "Compare `memory.stat` fields (hierarchical_memory_limit vs. active_file) before and after writing to the reclaim interface.",
    "date": "2026-04-24",
    "id": 1777008511,
    "type": "error"
});