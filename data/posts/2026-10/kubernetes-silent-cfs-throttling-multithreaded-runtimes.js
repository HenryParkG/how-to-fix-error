window.onPostDataLoaded({
    "title": "Fixing Kubernetes Silent CFS Bandwidth Throttling",
    "slug": "kubernetes-silent-cfs-throttling-multithreaded-runtimes",
    "language": "Kubernetes",
    "code": "CPUThrottled",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>When specifying CPU limits on Kubernetes pods (e.g., <code>resources.limits.cpu: \"2\"</code>), the container runtime translates these requirements into Linux Completely Fair Scheduler (CFS) bandwidth control quotas under the <code>cpu.cfs_quota_us</code> and <code>cpu.cfs_period_us</code> cgroups interface. By default, the period is fixed at 100ms (100,000\u00b5s). A container limited to 2 CPUs receives a quota budget of 200ms per 100ms wall-clock period.</p><p>Multithreaded runtimes such as the Go runtime, JVM, or Node.js thread pools execute across numerous OS threads simultaneously. If a multi-threaded process activates 16 threads concurrently to process a network burst, each thread consumes processor time in parallel. In this scenario, the 200ms allocation is entirely consumed within just 12.5ms of real time (16 threads * 12.5ms = 200ms). For the remaining 87.5ms of the CFS period, the kernel suspends all container threads completely, introducing severe micro-stalls and tail latency spikes even when average CPU utilization across the node remains critically low.</p>",
    "root_cause": "The Linux CFS bandwidth scheduler enforces aggregate quota per period across all running threads, causing parallel worker threads to rapidly deplete quota early in the 100ms window and freeze execution until the next period reset.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n      - name: multithreaded-app\n        image: golang-service:latest\n        # Unbounded runtime threads + strict CFS limit = aggressive throttling\n        resources:\n          requests:\n            cpu: \"1000m\"\n          limits:\n            cpu: \"2000m\" # Quota: 200ms per 100ms period",
    "solution_desc": "Eliminate strict CPU limits to avoid CFS bandwidth scheduling or tune runtime thread allocation (e.g., `GOMAXPROCS` or `-XX:ActiveProcessorCount`) to closely match the configured CFS quota. When limits are strictly required by platform policy, raise the CFS period (`cpu.cfs_period_us`) via container runtime flags to provide larger continuous execution intervals.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n      - name: multithreaded-app\n        image: golang-service:latest\n        env:\n        # Restrict runtime parallelism to quota allocation\n        - name: GOMAXPROCS\n          value: \"2\"\n        resources:\n          requests:\n            cpu: \"2000m\"\n            memory: \"4Gi\"\n          # Best practice: Avoid limits or set them to match node boundaries\n          # to eliminate the CFS scheduler throttling mechanism entirely\n          limits:\n            memory: \"4Gi\"",
    "verification": "Inspect `/sys/fs/cgroup/cpu/cpu.stat` (cgroup v1) or `cpu.stat` (cgroup v2) within the container, or examine the Prometheus metric `container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total`. Verify that the throttled periods percentage drops to 0%.",
    "date": "2026-10-18",
    "id": 1792327987,
    "type": "error"
});