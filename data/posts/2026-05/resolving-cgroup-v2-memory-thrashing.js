window.onPostDataLoaded({
    "title": "Resolving Cgroup v2 Memory Page Fault Thrashing",
    "slug": "resolving-cgroup-v2-memory-thrashing",
    "language": "Linux",
    "code": "OOM_RECLAIM_LOOP",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Linux Cgroup v2 environments, applications often experience severe latency spikes despite remaining under the <code>memory.max</code> limit. This occurs because the kernel enters an aggressive reclaim/refault cycle known as thrashing. When <code>memory.high</code> is approached, the kernel attempts to reclaim file-backed pages to make room for anonymous memory. If the application's working set includes frequently accessed mapped files, these pages are immediately refaulted, causing a massive increase in minor page faults and CPU steal time.</p>",
    "root_cause": "The kernel's 'workingset' detection mechanism fails to protect active file caches when memory.high is set too close to the actual memory usage without adequate memory.low protection, causing constant eviction of hot pages.",
    "bad_code": "# Setting only max limits without protection\necho \"2G\" > /sys/fs/cgroup/workload/memory.max\necho \"1.8G\" > /sys/fs/cgroup/workload/memory.high",
    "solution_desc": "Implement memory protection using memory.low to guarantee a minimum resident set size that cannot be reclaimed, and use memory.reclaim to proactively manage pressure before the hard limit is hit.",
    "good_code": "# Protect the working set and set a realistic threshold\necho \"1G\" > /sys/fs/cgroup/workload/memory.low\necho \"2.2G\" > /sys/fs/cgroup/workload/memory.max\necho \"2G\" > /sys/fs/cgroup/workload/memory.high",
    "verification": "Monitor /proc/vmstat for 'workingset_refault' spikes and check 'memory.stat' for high pgscan/pgsteal ratios.",
    "date": "2026-05-16",
    "id": 1778917828,
    "type": "error"
});