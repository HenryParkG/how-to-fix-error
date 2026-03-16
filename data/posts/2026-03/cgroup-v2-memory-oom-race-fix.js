window.onPostDataLoaded({
    "title": "Fixing Cgroup v2 Memory OOM Race Conditions",
    "slug": "cgroup-v2-memory-oom-race-fix",
    "language": "C",
    "code": "Kernel.OOM.Race",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Cgroup v2, a race condition occurs when the memory controller attempts to invoke the OOM killer across multiple CPUs simultaneously. If memory pressure hits the <code>memory.max</code> hard limit while the kernel is performing synchronous page reclaim, the system can enter a deadlock state or prematurely kill the wrong process because the memory usage statistics haven't updated across all cores yet.</p>",
    "root_cause": "The synchronous nature of the memory reclaimer in older Linux kernels failing to synchronize the memcg (Memory Control Group) hierarchy lock during concurrent limit violations.",
    "bad_code": "# Setting hard limit only\necho \"1G\" > /sys/fs/cgroup/workload/memory.max",
    "solution_desc": "Utilize the <code>memory.high</code> water mark as a soft limit/throttle. This triggers asynchronous reclaim before the hard <code>memory.max</code> is reached, effectively avoiding the OOM race condition by slowing down allocators.",
    "good_code": "# Set soft throttle at 800M and hard limit at 1G\necho \"800M\" > /sys/fs/cgroup/workload/memory.high\necho \"1G\" > /sys/fs/cgroup/workload/memory.max",
    "verification": "Stress test with 'stress-ng --vm' and monitor /proc/vmstat for 'oom_kill' events versus 'pgscan_direct' to ensure throttling is active.",
    "date": "2026-03-16",
    "id": 1773624310,
    "type": "error"
});