window.onPostDataLoaded({
    "title": "Resolving K8s CNI IPAM Exhaustion & Sandbox Creation Stalls",
    "slug": "k8s-cni-ipam-exhaustion-pod-sandbox-deadlocks",
    "language": "Kubernetes",
    "code": "FailedCreatePodSandBox",
    "tags": [
        "Kubernetes",
        "AWS",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn Kubernetes clusters, Pods frequently enter <code>ContainerCreating</code> or <code>CrashLoopBackOff</code> states with the error <code>FailedCreatePodSandBox: plugin type=\"aws-cni\"/\"calico\" failed (add): ipam: no IP addresses available in range</code>.</p><p>This condition occurs when Container Network Interface (CNI) IP Address Management (IPAM) controllers exhaust the allocated subnet CIDR pool or fail to reclaim leaked IP allocations from rapidly terminated pods. When IPAM allocation stalls, the runtime (containerd/CRI-O) deadlocks waiting for network setup RPC responses, leading to node-level scheduling bottlenecks and pod admission starvation.</p>",
    "root_cause": "Subnet IP exhaustion caused by fixed ENI limits, lingering stale endpoints from crashed containers, and lack of VPC CNI prefix delegation, leaving insufficient free IP allocations for new Pod sandboxes.",
    "bad_code": "# Problematic aws-node daemonset configuration (Defaults to single IP allocations)\napiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: aws-node\n  namespace: kube-system\nspec:\n  template:\n    spec:\n      containers:\n      - name: aws-node\n        env:\n        - name: WARM_IP_TARGET\n          value: \"5\"\n        - name: ENABLE_PREFIX_DELEGATION\n          value: \"false\" # Limits node to physical ENI secondary IP cap",
    "solution_desc": "Enable CNI Prefix Delegation (`ENABLE_PREFIX_DELEGATION=true`) on supported clouds (like AWS VPC CNI) to allocate `/28` IPv4 subnets per ENI slot rather than single IPs. Configure dynamic warm target buffers and ensure stale network namespaces are garbage-collected by the container runtime.",
    "good_code": "apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: aws-node\n  namespace: kube-system\nspec:\n  template:\n    spec:\n      containers:\n      - name: aws-node\n        env:\n        - name: ENABLE_PREFIX_DELEGATION\n          value: \"true\"\n        - name: WARM_PREFIX_TARGET\n          value: \"1\"\n        - name: WARM_IP_TARGET\n          value: \"5\"\n        - name: MINIMUM_IP_TARGET\n          value: \"10\"",
    "verification": "Execute `kubectl describe pod <pod-name>` to verify that `FailedCreatePodSandBox` events cease. Run `kubectl get nodes -o custom-columns=NAME:.metadata.name,PODS:.status.allocatable.pods` and inspect CNI daemon logs (`kubectl logs -n kube-system -l k8s-app=aws-node`) to ensure prefix allocation is active.",
    "date": "2026-08-16",
    "id": 1786851664,
    "type": "error"
});