window.onPostDataLoaded({
    "title": "Fixing gRPC L7 Load Balancing Imbalance",
    "slug": "fixing-grpc-l7-load-balancing-imbalance",
    "language": "Kubernetes",
    "code": "Traffic Imbalance",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>gRPC utilizes HTTP/2, which maintains long-lived TCP connections and multiplexes multiple requests over a single socket. Standard L4 load balancers (like Kubernetes Services) only balance new TCP connections. Once a gRPC client connects to a pod, all subsequent requests follow that connection. If one pod starts earlier or a cluster scales up, the new pods remain idle because the clients never drop their original connections to the old pods.</p>",
    "root_cause": "Sticky TCP sessions in HTTP/2 prevent per-request distribution across a pool of backends, leading to 'hot' pods and underutilized resources.",
    "bad_code": "apiVersion: v1\nkind: Service\nmetadata:\n  name: grpc-service\nspec:\n  ports:\n  - port: 50051\n    targetPort: 50051\n  selector:\n    app: grpc-server\n# Clients connect to 'grpc-service' ClusterIP directly.",
    "solution_desc": "Deploy an L7 load balancer (like Envoy or Istio) that can parse HTTP/2 frames and balance individual requests, or configure 'MaxConnectionAge' on the gRPC server to force clients to reconnect and re-resolve DNS.",
    "good_code": "// On the gRPC Server (Go)\ns := grpc.NewServer(\n    grpc.KeepaliveParams(keepalive.ServerParameters{\n        MaxConnectionAge:      30 * time.Second,\n        MaxConnectionAgeGrace: 5 * time.Second,\n    }),\n)\n// This forces clients to re-balance every 30s.",
    "verification": "Monitor the 'container_cpu_usage_seconds_total' metric across all pods in the deployment to ensure even distribution under load.",
    "date": "2026-02-26",
    "id": 1772068468,
    "type": "error"
});