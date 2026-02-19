window.onPostDataLoaded({
    "title": "Debugging Kubernetes CFS Bandwidth Throttling",
    "slug": "k8s-cfs-throttling-latency",
    "language": "Kubernetes",
    "code": "CPU Throttling",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kubernetes uses Completely Fair Scheduler (CFS) quotas to enforce CPU limits. However, many developers encounter significant tail latency (p99) even when the average CPU utilization is well below the limit. This happens because the Linux kernel checks usage over very short periods (usually 100ms). If a multi-threaded application consumes its entire quota in the first 10ms of that window, it is throttled for the remaining 90ms, causing massive latency spikes despite appearing 'idle' on average metrics.</p>",
    "root_cause": "The CFS quota mechanism enforces limits per period. High-concurrency runtimes (Go, Java) can burst across many cores simultaneously, exhausting the quota in a fraction of the enforcement interval.",
    "bad_code": "resources:\n  limits:\n    cpu: \"200m\"\n  requests:\n    cpu: \"200m\"",
    "solution_desc": "Increase the CPU limit to allow for bursts or enable the CPU Burst feature in newer Linux kernels (5.14+). Alternatively, remove limits and rely on requests and CPU shares if the node is not overcommitted.",
    "good_code": "resources:\n  limits:\n    cpu: \"1000m\" # Higher headroom for bursts\n  requests:\n    cpu: \"200m\"",
    "verification": "Monitor the Prometheus metric 'container_cpu_cfs_throttled_periods_total'. A rising count indicates the fix is still needed.",
    "date": "2026-02-19",
    "id": 1771476491,
    "type": "error"
});