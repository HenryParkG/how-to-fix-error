window.onPostDataLoaded({
    "title": "Debug Kubernetes cgroup v2 Throttling and Silent OOM",
    "slug": "kubernetes-cgroupv2-cfs-throttling-silent-oomkill",
    "language": "Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Under Kubernetes nodes operating on Linux cgroup v2, resource tracking shifts from distinct subsystem mounts to a unified hierarchy using <code>memory.max</code>, <code>memory.high</code>, and <code>cpu.max</code>. A frequent issue under this architecture is unexpected CFS (Completely Fair Scheduler) quota throttling and silent container terminations without application-level stack traces.</p><p>When a container initiates multi-threaded parallel workloads (such as Go runtime garbage collection or Java JIT compilation), thread bursts exhaust the container's fractional CFS quota within the first few milliseconds of the 100ms quota period. The kernel throttles the container for the remainder of the period. Simultaneously, when memory pressure reaches <code>memory.max</code>, cgroup v2 triggers an asynchronous OOM-killer. If <code>memory.oom.group</code> is enabled, all tasks within the cgroup are killed simultaneously with SIGKILL (exit code 137), producing no standard language core dump or logging output.</p>",
    "root_cause": "Mismatched CFS quotas throttling multi-threaded processes, combined with cgroup v2 unified memory pressure killing process trees silently when `memory.max` is breached by unmonitored off-heap or native buffers.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-processor\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: processor\n        image: payment-service:latest\n        resources:\n          # Anti-pattern: Low CPU quota causes severe CFS throttling with multi-threading\n          # Memory limit equal to request with no headroom for kernel buffers\n          limits:\n            cpu: \"500m\"\n            memory: \"512Mi\"\n          requests:\n            cpu: \"100m\"\n            memory: \"512Mi\"",
    "solution_desc": "Set appropriate CPU request/limit ratios or omit hard CPU limits if using autonomous pod autoscalers to prevent CFS throttling. Synchronize runtime thread counts (e.g., `GOMAXPROCS` or `-XX:ActiveProcessorCount`) with the container quota. Configure sufficient memory headroom to account for OS page caches and native buffers.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-processor\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: processor\n        image: payment-service:latest\n        env:\n        # Ensure Go runtime does not spawn threads based on total node CPU cores\n        - name: GOMAXPROCS\n          value: \"2\"\n        resources:\n          limits:\n            cpu: \"2000m\"\n            memory: \"1Gi\"\n          requests:\n            cpu: \"1000m\"\n            memory: \"768Mi\"",
    "verification": "Monitor `container_cpu_cfs_throttled_periods_total` via Prometheus. Inspect node cgroup v2 status using `cat /sys/fs/cgroup/system.slice/.../memory.events` to verify that `oom_kill` and `high` counters remain zero.",
    "date": "2026-11-09",
    "id": 1794236119,
    "type": "error"
});