window.onPostDataLoaded({
    "title": "Fixing gRPC Connection Pinning in Kubernetes Services",
    "slug": "fixing-grpc-connection-pinning-kubernetes",
    "language": "Go",
    "code": "gRPC Load Imbalance / Connection Pinning",
    "tags": [
        "Go",
        "Kubernetes",
        "gRPC",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When deploying microservices in Kubernetes that communicate via gRPC, developers often use Headless Services to discover backend pod IPs. However, because gRPC leverages HTTP/2 multiplexing, clients establish a single long-lived TCP connection to an resolved IP address and route all subsequent RPC calls over that single socket.</p><p>This causes severe load imbalance (connection pinning): when the cluster scales up or a pod restarts, some pods receive 100% of the traffic while newly created pods sit idle. Standard L4 Kubernetes services (ClusterIP) do not solve this because they balance traffic at the connection level rather than the HTTP/2 request level.</p>",
    "root_cause": "The default gRPC client resolver resolves the DNS name of the headless service once at startup. It establishes a single TCP connection to one of the returned IPs and keeps multiplexing requests indefinitely. It fails to re-resolve DNS or load balance individual RPC calls across the multiple IP endpoints returned by the Kubernetes headless service.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"log\"\n\t\"google.golang.org/grpc\"\n)\n\nfunc main() {\n\t// BAD: Simple dial resolves once and locks onto a single IP endpoint\n\tconn, err := grpc.Dial(\"my-service.default.svc.cluster.local:8080\", grpc.WithInsecure())\n\tif err != nil {\n\t\tlog.Fatalf(\"Failed to connect: %v\", err)\n\t}\n\tdefer conn.Close()\n\n\t// Subsequent requests remain pinned to the original established TCP tunnel\n}",
    "solution_desc": "To resolve connection pinning, configure the gRPC client to use the 'dns' resolver scheme and specify a round-robin load balancing policy. This instructs the client to resolve the DNS record, discover all underlying Pod IPs from the Headless Service, and distribute calls evenly among active channels. Additionally, set max connection age parameters on the gRPC server to periodically close connections, forcing clients to re-resolve DNS endpoints.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"log\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nfunc main() {\n\t// Use the dns scheme and specify round_robin load balancing policy config\n\tserviceConfig := `{\"loadBalancingConfig\": [{\"round_robin\":{}}]}`\n\t\n\tctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)\n\tdefer cancel()\n\n\tconn, err := grpc.DialContext(\n\t\tctx,\n\t\t\"dns:///my-service.default.svc.cluster.local:8080\",\n\t\tgrpc.WithInsecure(),\n\t\tgrpc.WithDefaultServiceConfig(serviceConfig),\n\t\tgrpc.WithKeepaliveParams(keepalive.ClientParameters{\n\t\t\tTime:                10 * time.Second,\n\t\t\tTimeout:             3 * time.Second,\n\t\t\tPermitWithoutStream: true,\n\t\t}),\n\t)\n\tif err != nil {\n\t\tlog.Fatalf(\"Failed to connect with LB: %v\", err)\n\t}\n\tdefer conn.Close()\n}",
    "verification": "Deploy the fixed gRPC client and multiple server replica pods inside Kubernetes. Scale up the deployment using 'kubectl scale --replicas=5 deployment/my-service'. Run a continuous client benchmark loop and watch container statistics via 'kubectl top pods'. You should observe even CPU and memory utilization across all 5 replica pods, confirming active connection balancing.",
    "date": "2026-07-18",
    "id": 1784351778,
    "type": "error"
});