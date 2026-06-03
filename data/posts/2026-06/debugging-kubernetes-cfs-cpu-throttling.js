window.onPostDataLoaded({
    "title": "Debugging Kubernetes CFS CPU Throttling",
    "slug": "debugging-kubernetes-cfs-cpu-throttling",
    "language": "Kubernetes, Linux Kernel",
    "code": "CPUThrottling",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In containerized workloads, resource exhaustion is a common issue. However, CPU throttling in Kubernetes often occurs even when CPU usage metrics show consumption far below the specified limit. This counterintuitive behavior is caused by the Linux Completely Fair Scheduler (CFS) bandwidth controller. The CFS works by assigning quota within strict time intervals (typically 100ms periods).</p><p>When a multi-threaded application processes a sudden burst of parallel tasks, it can consume its allocated quota long before the 100ms period ends. As a result, the CFS locks down the container, causing severe request latency spikes and starvation, despite average utilization over a 1-minute Prometheus sampling window appearing perfectly healthy.</p>",
    "root_cause": "The CFS bandwidth controller operates on a fixed time slice (default 100ms). In highly multi-threaded runtimes (e.g., Go, Java, Node.js), multiple threads can run concurrently on different CPU cores. A container restricted to 2.0 CPUs (200ms of run-time per 100ms period) can consume its entire quota in 25ms if running on 8 cores concurrently (8 cores * 25ms = 200ms quota). It is then throttled for the remaining 75ms of the period, leading to application starvation.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: microservice-api\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: api-server\n        image: go-api:v1.2.0\n        resources:\n          requests:\n            memory: \"512Mi\"\n            cpu: \"500m\"\n          limits:\n            memory: \"1Gi\"\n            cpu: \"1000m\" # Strict limit enforces low quota per 100ms interval",
    "solution_desc": "To fix CFS starvation, you can take three distinct approaches depending on your infrastructure constraints: 1) Remove the hard CPU limits entirely and rely solely on requests for resource allocation, using CPU shares instead of quota enforcement. 2) Increase the limits significantly to provide headroom for high concurrency spikes. 3) Upgrade to newer Linux kernels (Linux 5.14+) which support CFS burst capability, or tune the kubelet configuration (`--cpu-cfs-quota-period`) to match application workloads.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: microservice-api\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: api-server\n        image: go-api:v1.2.0\n        resources:\n          requests:\n            memory: \"512Mi\"\n            cpu: \"1000m\" # High requests to ensure adequate scheduling priority\n          # CPU limit is omitted to bypass CFS throttling entirely\n          limits:\n            memory: \"1Gi\"",
    "verification": "Deploy the updated resource configurations and monitor the metrics using Prometheus. Query the CFS throttled periods with: `sum(increase(container_cpu_cfs_throttled_periods_total[5m])) by (container) / sum(increase(container_cpu_cfs_periods_total[5m])) by (container)`. Verify that this ratio drops to near-zero.",
    "date": "2026-06-03",
    "id": 1780474068,
    "type": "error"
});