window.onPostDataLoaded({
    "title": "Mitigating Cgroup v2 PSI & OOM Killer Cascades",
    "slug": "linux-cgroupv2-psi-oom-killer-cascade",
    "language": "Kubernetes",
    "code": "OOMKilled / MemoryPressure",
    "tags": [
        "Kubernetes",
        "Docker",
        "Linux",
        "Error Fix"
    ],
    "analysis": "<p>In containerized workloads managed via Linux Cgroups v2, aggressive memory reclamation and kernel page thrashing often precede an invocation of the Out-Of-Memory (OOM) killer. When memory usage nears <code>memory.max</code>, the kernel aggressively attempts to reclaim page cache memory, driving Pressure Stall Information (PSI) metrics to critical thresholds.</p><p>As file-backed pages are continually evicted and refetched from disk, I/O latency spikes, causing application threads to stall. If memory pressure remains unresolved, the kernel invokes the OOM killer on high-badness processes, leading to container crashes that shift load to sibling pods, producing a cluster-wide cascading failure.</p>",
    "root_cause": "Missing memory.high throttling thresholds and misconfigured memory requests/limits allow workloads to rapidly exhaust anonymous and page cache memory without gradual backoff prior to hard memory.max termination.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: batch-processor\nspec:\n  template:\n    spec:\n      containers:\n      - name: worker\n        image: worker:v1\n        resources:\n          # Anti-pattern: Missing memory request buffer and equal limits causing sudden OOM\n          limits:\n            memory: \"2Gi\"\n          requests:\n            memory: \"2Gi\"",
    "solution_desc": "Configure proportional memory requests and limits while utilizing cgroup v2 memory.high thresholds for proactive memory throttling before reaching hard limits. Implement PSI-aware daemon monitors to trigger graceful garbage collection or load shedding before the OOM killer intervenes.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: batch-processor\nspec:\n  template:\n    spec:\n      containers:\n      - name: worker\n        image: worker:v2\n        resources:\n          requests:\n            memory: \"1.5Gi\"\n            cpu: \"500m\"\n          limits:\n            memory: \"2.5Gi\"\n            cpu: \"1000m\"\n        env:\n        - name: GOMEMLIMIT\n          value: \"2100MiB\" # Go soft memory limit prevents reaching hard cgroup limit\n        - name: GODEBUG\n          value: \"madvdontneed=1\"",
    "verification": "Inspect `/sys/fs/cgroup/memory.pressure` inside the container or node, ensuring the `some avg10` and `full avg10` stall metrics remain below 10%, and confirm zero pod evictions with `kubectl get events --field-selector reason=OOMKilled`.",
    "date": "2026-08-20",
    "id": 1787218009,
    "type": "error"
});