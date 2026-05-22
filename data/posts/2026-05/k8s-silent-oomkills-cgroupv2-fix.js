window.onPostDataLoaded({
    "title": "Fixing K8s Silent Container OOMKills on Cgroup v2",
    "slug": "k8s-silent-oomkills-cgroupv2-fix",
    "language": "Go",
    "code": "Exit Code 137",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>As Kubernetes environments transition from cgroup v1 to cgroup v2, legacy containerized applications and microservice runtimes often suffer silent out-of-memory (OOM) kills. Because cgroup v2 uses a single unified hierarchy, legacy absolute system path mappings like <code>/sys/fs/cgroup/memory/memory.limit_in_bytes</code> no longer exist. Application runtimes that attempt to auto-configure memory heap sizes based on these obsolete paths fail back to reading total system memory.</p><p>When this happens, a container running on a 64GB node with a 2GB limit thinks it has 64GB available. The runtime allocates memory unchecked, triggering a kernel-level OOM action. The kernel sends a SIGKILL, exiting with code 137. Because this happens instantly outside of the application's runtime loop, no logs are flushed, leaving platform engineers with zero context.</p>",
    "root_cause": "Runtime failure to detect cgroup v2 unified memory limits, defaulting to host OS memory limits. Under cgroup v2, the limit is defined in /sys/fs/cgroup/memory.max rather than the legacy v1 path, resulting in miscalculated application heap configurations.",
    "bad_code": "func getMemoryLimit() (int64, error) {\n    data, err := os.ReadFile(\"/sys/fs/cgroup/memory/memory.limit_in_bytes\")\n    if err != nil {\n        // Fallback to host system memory if file doesn't exist\n        return getHostMemory()\n    }\n    return strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64)\n}",
    "solution_desc": "Update resource limits parsing to gracefully detect and parse the unified cgroup v2 controller interface (/sys/fs/cgroup/memory.max). Implement a unified reader fallback chain. For Go runtimes, explicitly set the GOMEMLIMIT environment variable to match the Kubernetes resource limit.",
    "good_code": "func getMemoryLimit() (int64, error) {\n    // Try cgroup v2 unified path first\n    if data, err := os.ReadFile(\"/sys/fs/cgroup/memory.max\"); err == nil {\n        limitStr := strings.TrimSpace(string(data))\n        if limitStr == \"max\" {\n            return getHostMemory() // Uncapped container\n        }\n        return strconv.ParseInt(limitStr, 10, 64)\n    }\n    // Fallback to legacy cgroup v1\n    if data, err := os.ReadFile(\"/sys/fs/cgroup/memory/memory.limit_in_bytes\"); err == nil {\n        return strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64)\n    }\n    return getHostMemory()\n}",
    "verification": "Deploy the service with memory limits applied under cgroup v2, trigger a load test, and ensure the process logs internal GC activity or reports the correct memory capacity. Monitor via kubectl describe pod and verify that no Exit 137 terminations occur.",
    "date": "2026-05-22",
    "id": 1779449955,
    "type": "error"
});