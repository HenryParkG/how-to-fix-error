window.onPostDataLoaded({
    "title": "Fixing CFS Bandwidth Throttling in K8s",
    "slug": "cfs-bandwidth-throttling-k8s",
    "language": "Go",
    "code": "CPUThrottling",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>The Linux Kernel Completely Fair Scheduler (CFS) bandwidth controller is used by Kubernetes to enforce CPU limits. A long-standing bug in the kernel (pre-5.4) caused containers to be throttled prematurely due to how CPU credits were expired across periods. Even if a microservice used only a fraction of its assigned CPU, millisecond-level bursts would trigger the quota mechanism, leading to artificial latency tail-spikes (P99).</p><p>This is particularly devastating for Go or Node.js runtimes that utilize multiple threads, as the aggregate usage across cores exhausts the quota faster than the replenishment period (usually 100ms).</p>",
    "root_cause": "A kernel-level race condition and accounting error in the CFS quota replenishment logic.",
    "bad_code": "resources:\n  limits:\n    cpu: \"500m\"\n  requests:\n    cpu: \"500m\"",
    "solution_desc": "Upgrade the Linux kernel to 5.4+ or 5.10 LTS where the fix is backported. Alternatively, use the Kubernetes Static CPU Manager policy or increase the CFS period to reduce the frequency of quota enforcement.",
    "good_code": "# Kubelet Configuration\ncpuManagerPolicy: static\n# Or increase CFS period in sysctl\nsysctl -w kernel.sched_cfs_bandwidth_slice_us=50000",
    "verification": "Check /sys/fs/cgroup/cpu/cpu.stat for nr_throttled and throttled_time metrics.",
    "date": "2026-05-13",
    "id": 1778671562,
    "type": "error"
});