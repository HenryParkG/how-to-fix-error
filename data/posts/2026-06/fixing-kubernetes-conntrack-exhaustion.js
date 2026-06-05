window.onPostDataLoaded({
    "title": "Fixing Kubernetes Conntrack Table Exhaustion",
    "slug": "fixing-kubernetes-conntrack-exhaustion",
    "language": "Kubernetes",
    "code": "NF_CONNTRACK_FULL",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In highly concurrent, high-throughput Kubernetes deployments, services frequently drop network packets unexpectedly. This is often caused by the exhaustion of the Linux kernel's netfilter connection tracking (conntrack) table. When a microservice opens and closes many TCP/UDP sockets rapidly, the conntrack table fills up with entries in short-lived states like TIME_WAIT. Once the maximum capacity (<code>nf_conntrack_max</code>) is reached, the kernel discards incoming and outgoing connection attempts, causing connection timeouts and degraded cluster communication.</p>",
    "root_cause": "The sysctl parameter 'net.netfilter.nf_conntrack_max' is configured too low relative to the volume of concurrent and transient connection requests handled by the host node.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-gateway\nspec:\n  replicas: 10\n  template:\n    spec:\n      containers:\n      - name: gateway\n        image: nginx:alpine\n        # No sysctl initialization or configuration present\n        # Standard kernel defaults restrict connection tracking limit",
    "solution_desc": "Increase the maximum connection tracking table limits and tune timeout parameters (specifically TIME_WAIT and established connection timeouts) using a DaemonSet or Node init container configured with privileged kernel tuning permissions.",
    "good_code": "apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: sysctl-tuner\n  namespace: kube-system\nspec:\n  selector:\n    matchLabels:\n      name: sysctl-tuner\n  template:\n    metadata:\n      labels:\n        name: sysctl-tuner\n    spec:\n      initContainers:\n      - name: sysctl\n        image: busybox\n        securityContext:\n          privileged: true\n        command:\n        - sh\n        - -c\n        - |\n          sysctl -w net.netfilter.nf_conntrack_max=1048576\n          sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=86400\n          sysctl -w net.netfilter.nf_conntrack_tcp_timeout_time_wait=30\n      containers:\n      - name: pause\n        image: registry.k8s.io/pause:3.6",
    "verification": "Check connection drops on the host machine using 'dmesg | grep conntrack' and monitor system tables with 'sysctl net.netfilter.nf_conntrack_count'. Ensure the count remains safely below the new capacity.",
    "date": "2026-06-05",
    "id": 1780660600,
    "type": "error"
});