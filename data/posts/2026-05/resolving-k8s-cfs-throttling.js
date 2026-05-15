window.onPostDataLoaded({
    "title": "Fixing Kubernetes CFS Throttling for Low-Latency Apps",
    "slug": "resolving-k8s-cfs-throttling",
    "language": "Kubernetes",
    "code": "CPUThrottlingHigh",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes, the Completely Fair Scheduler (CFS) quota mechanism is used to enforce CPU limits. However, low-latency applications often experience 'throttling' even when their total CPU usage is well below the limit. This occurs because the Linux kernel tracks usage in 100ms periods.</p><p>If a multi-threaded application bursts and consumes its quota within the first 10ms of a period, the kernel throttles the process for the remaining 90ms. This results in significant tail latency (P99 spikes) that are difficult to diagnose without monitoring container_cpu_cfs_throttled_seconds_total.</p>",
    "root_cause": "The kernel's CFS quota enforcement lacks a 'burst' buffer, causing high-concurrency tasks to exhaust their millisecond-level quota prematurely despite having sufficient aggregate CPU capacity.",
    "bad_code": "resources:\n  limits:\n    cpu: \"200m\"\n    memory: \"512Mi\"\n  requests:\n    cpu: \"200m\"\n    memory: \"512Mi\"",
    "solution_desc": "To resolve this, we should enable the 'CPU Manager' with a 'static' policy for exclusive core pinning or, for modern kernels (Linux 5.14+), utilize the 'CPU Burst' feature in Kubernetes 1.22+ to allow containers to borrow future quota.",
    "good_code": "apiVersion: kubelet.config.k8s.io/v1beta1\nkind: KubeletConfiguration\ncpuManagerPolicy: static\n---\n# In Pod Spec, ensure integer CPU and Guaranteed QoS\nresources:\n  limits:\n    cpu: \"2\"\n    memory: \"2Gi\"\n  requests:\n    cpu: \"2\"\n    memory: \"2Gi\"",
    "verification": "Check 'kubectl get --raw /metrics' or Prometheus for 'container_cpu_cfs_throttled_periods_total'. It should drop to near zero after applying the static policy or burst configuration.",
    "date": "2026-05-15",
    "id": 1778843605,
    "type": "error"
});