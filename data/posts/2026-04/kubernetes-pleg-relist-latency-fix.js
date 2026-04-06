window.onPostDataLoaded({
    "title": "Mitigating Kubernetes PLEG Relist Latency",
    "slug": "kubernetes-pleg-relist-latency-fix",
    "language": "Go",
    "code": "PLEG Relist Timeout",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>PLEG (Pod Lifecycle Event Generator) is a Kubelet module that adjusts the pod cache by relisting container states from the runtime. In high-density nodes (100+ pods), the relist operation can exceed the 1-second threshold. This is often caused by a bottleneck in the Container Runtime Interface (CRI) or excessive I/O wait when querying the Docker/Containerd socket under high churn.</p>",
    "root_cause": "CRI socket congestion and synchronous container status checks blocking the Kubelet's main loop in high-density environments.",
    "bad_code": "# Default Kubelet Configuration (prone to latency)\nKUBELET_ARGS=\"--pod-manifest-path=/etc/kubernetes/manifests --event-qps=5\"",
    "solution_desc": "Increase the Kubelet event rate limit, migrate to Containerd (which has lower overhead than Docker), and tune the PLEG duration if hardware allows. Additionally, disable CPU CFS quota if unnecessary to reduce context switching.",
    "good_code": "# Optimized Kubelet Configuration\nKUBELET_ARGS=\"--event-qps=50 --event-burst=100 --container-runtime-endpoint=unix:///run/containerd/containerd.sock --serialize-image-pulls=false\"",
    "verification": "Check Kubelet logs for 'skipping pod lifecycle event'. Use 'kubectl get nodes' to ensure node status remains 'Ready' without frequent 'NotReady' flapping.",
    "date": "2026-04-06",
    "id": 1775459907,
    "type": "error"
});