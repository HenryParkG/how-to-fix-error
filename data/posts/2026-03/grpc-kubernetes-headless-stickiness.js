window.onPostDataLoaded({
    "title": "Solving gRPC Stickiness in Kubernetes Headless Services",
    "slug": "grpc-kubernetes-headless-stickiness",
    "language": "Go / gRPC",
    "code": "Load Balancing",
    "tags": [
        "gRPC",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes, standard ClusterIP services act as L4 load balancers using iptables or IPVS. This works for HTTP/1.1 where connections are frequently closed. However, gRPC utilizes HTTP/2, which maintains long-lived TCP connections and multiplexes requests over them. When a gRPC client connects to a ClusterIP, it hits one pod and stays connected indefinitely. Subsequent requests from that client never reach other pods, leading to severe traffic imbalance and 'stickiness'.</p>",
    "root_cause": "The L4 proxy in K8s (kube-proxy) cannot see inside the HTTP/2 stream to distribute individual gRPC calls; it only balances the initial TCP connection.",
    "bad_code": "// Client connecting to a standard service\nconn, err := grpc.Dial(\"my-service:50051\", grpc.WithInsecure())\nif err != nil {\n    log.Fatalf(\"fail to dial: %v\", err)\n}",
    "solution_desc": "Convert the service to a 'Headless Service' (clusterIP: None) and implement client-side load balancing in gRPC. Use the 'dns' resolver with a 'round_robin' load balancing policy.",
    "good_code": "// 1. K8s Service: clusterIP: None\n// 2. Client code with round_robin policy\nconn, err := grpc.Dial(\n    \"dns:///my-headless-service:50051\",\n    grpc.WithDefaultServiceConfig(`{\"loadBalancingConfig\": [{\"round_robin\":{}}]}`),\n    grpc.WithTransportCredentials(insecure.NewCredentials()),\n)",
    "verification": "Scale the backend deployment to 3 replicas and monitor metrics (e.g., Prometheus) to ensure requests are distributed evenly across all pod IPs.",
    "date": "2026-03-11",
    "id": 1773221687,
    "type": "error"
});