window.onPostDataLoaded({
    "title": "Resolve K8s API Starvation via Controller Throttling",
    "slug": "k8s-api-server-starvation-throttling",
    "language": "Go",
    "code": "APIError429",
    "tags": [
        "Kubernetes",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In large-scale Kubernetes clusters, the kube-apiserver can become unresponsive if controllers (like the kube-controller-manager or custom operators) flood it with requests. This 'starvation' prevents critical components like the Kubelet from reporting status, leading to node flapping. While Priority and Fairness (APF) helps, the root cause is often aggressive client-side QPS settings in the controller manager that bypass reasonable throughput limits.</p>",
    "root_cause": "High --kube-api-qps and --kube-api-burst settings in the controller-manager leading to request saturation.",
    "bad_code": "kube-controller-manager \\\n  --kube-api-qps=100 \\\n  --kube-api-burst=200 \\\n  --leader-elect=true",
    "solution_desc": "Implement client-side rate limiting by reducing QPS/Burst values and enabling the 'Priority and Fairness' feature in the API server to categorize and throttle traffic.",
    "good_code": "kube-controller-manager \\\n  --kube-api-qps=20 \\\n  --kube-api-burst=30 \\\n  --enable-priority-and-fairness=true",
    "verification": "Monitor the `apiserver_request_terminations_total` metric. A reduction in 429 status codes indicates the throttling is effective.",
    "date": "2026-03-19",
    "id": 1773883210,
    "type": "error"
});