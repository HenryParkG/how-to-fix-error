window.onPostDataLoaded({
    "title": "Resolving Silent K8s OOMKills in cgroup v2",
    "slug": "k8s-silent-oomkill-cgroup-v2",
    "language": "Kubernetes",
    "code": "OOM_KILL_V2",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>With the industry shift to cgroup v2, Kubernetes users have reported 'silent' OOMKills where pods disappear without the standard Exit Code 137 in the main container logs. This occurs because cgroup v2 manages memory pressure via <code>memory.max</code> and <code>memory.high</code> differently than v1's <code>memory.limit_in_bytes</code>. The discrepancy often results in the kernel killing a process within a sub-container or a sidecar without triggering the Kubelet's top-level event recorder accurately.</p>",
    "root_cause": "The kernel's OOM killer in cgroup v2 may target processes based on 'Pressure Stall Information' (PSI) before the Kubelet realizes the limit has been breached, leading to a race condition where the pod is terminated before the reason is logged to the API server.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: memory-hog\nspec:\n  containers:\n  - name: app\n    image: app:latest\n    resources:\n      limits:\n        memory: \"2Gi\" # No memory reservation or swap tuning",
    "solution_desc": "Implement 'MemoryQoS' feature gates in Kubernetes to leverage cgroup v2's 'memory.min' and 'memory.low' for better protection. Also, ensure the node's Kubelet configuration includes 'memoryThrottlingFactor' and monitor 'memory.events' within the cgroup filesystem to catch 'oom_kill' counts that don't reach the K8s event bus.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: memory-hog-fixed\nspec:\n  containers:\n  - name: app\n    image: app:latest\n    resources:\n      requests:\n        memory: \"1.5Gi\"\n      limits:\n        memory: \"2Gi\"\n  # Ensure Kubelet is configured with --feature-gates=\"MemoryQoS=true\"",
    "verification": "Check '/sys/fs/cgroup/memory.events' inside the container. If 'oom_kill' is non-zero but K8s reports 'Completed', the cgroup v2 discrepancy is confirmed and mitigated by setting requests closer to limits.",
    "date": "2026-02-23",
    "id": 1771809437,
    "type": "error"
});