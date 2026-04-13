window.onPostDataLoaded({
    "title": "Fixing Linux Kernel PSI Spikes in Cgroup v2 Workloads",
    "slug": "fixing-linux-kernel-psi-spikes-cgroup-v2",
    "language": "C",
    "code": "PressureStall",
    "tags": [
        "Docker",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Pressure Stall Information (PSI) provides a real-time view of resource contention across CPU, Memory, and IO. In Cgroup v2 environments, spikes often occur when the kernel's memory reclaim mechanism becomes too aggressive due to 'memory.high' limits being reached, or when CPU burst features in CFS (Completely Fair Scheduler) lead to short-term scheduling latencies that trigger 'some' or 'full' stall metrics despite low overall utilization.</p>",
    "root_cause": "Aggressive synchronous page reclaim triggered by tight memory.high thresholds and excessive CPU throttling when CFS quotas are exhausted without a burst buffer.",
    "bad_code": "resources:\n  limits:\n    cpu: \"1\"\n    memory: \"2Gi\"\n# No overhead management or burst allowed",
    "solution_desc": "Implement Cgroup v2 'memory.low' to guarantee a memory reserve and prevent premature reclaim. For CPU, enable 'cpu.max.burst' to handle transient spikes and configure PSI thresholds using the /proc/pressure interface to proactively manage workloads before stalls impact latency.",
    "good_code": "resources:\n  requests:\n    cpu: \"1\"\n    memory: \"2Gi\"\n  limits:\n    cpu: \"1.5\" # Allowing burst\n    memory: \"3Gi\"\n# In Cgroup v2, set memory.low to 1.5Gi",
    "verification": "Monitor /proc/pressure/memory and /proc/pressure/cpu; values should remain near zero during transient bursts.",
    "date": "2026-04-13",
    "id": 1776076020,
    "type": "error"
});