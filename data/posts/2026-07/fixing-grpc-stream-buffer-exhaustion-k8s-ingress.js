window.onPostDataLoaded({
    "title": "Fixing gRPC Stream Buffer Exhaustion in K8s Ingress",
    "slug": "fixing-grpc-stream-buffer-exhaustion-k8s-ingress",
    "language": "Go",
    "code": "HTTP/2 Stream Exhaustion",
    "tags": [
        "Kubernetes",
        "gRPC",
        "Go",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes microservice architectures utilizing gRPC multiplexing over persistent HTTP/2 connections, heavy streaming payloads through Kubernetes Ingress proxies (such as Envoy or NGINX Ingress) can result in TCP window exhaustion and buffer starvation. High stream concurrency combined with mismatched HTTP/2 flow control window settings causes backpressure deadlocks, throwing <code>RESOURCE_EXHAUSTED</code> or stream reset errors.</p>",
    "root_cause": "The ingress controller and backend gRPC services default to conservative HTTP/2 dynamic flow control windows (e.g., 64KB per stream). Under heavy ingress concurrency, memory limits imposed on K8s ingress pods prevent memory expansion for HTTP/2 connection buffers, stalling stream frame ACKs and causing connection buffer exhaustion.",
    "bad_code": "// Buggy Go backend gRPC server configuration using default flow-control windows\npackage main\n\nimport (\n    \"net\"\n    \"google.golang.org/grpc\"\n)\n\nfn main() {\n    lis, _ := net.Listen(\"tcp\", \":50051\")\n    // Default settings: InitialWindowSize = 64KB, Connection Window = 1MB\n    // Under 10,000 multiplexed streams through Ingress, streams starve rapidly\n    grpcServer := grpc.NewServer()\n    grpcServer.Serve(lis)\n}",
    "solution_desc": "Configure dynamic HTTP/2 flow control parameters on both backend gRPC servers and Envoy/NGINX Ingress settings. Increase initial window sizes (`InitialWindowSize`, `InitialConnWindowSize`), set max concurrent stream limits per TCP connection, and tune ingress pod memory requests.",
    "good_code": "// Optimized gRPC Server with custom HTTP/2 flow control windows\npackage main\n\nimport (\n    \"net\"\n    \"google.golang.org/grpc\"\n)\n\nfunc main() {\n    lis, _ := net.Listen(\"tcp\", \":50051\")\n    \n    grpcServer := grpc.NewServer(\n        grpc.InitialWindowSize(4 * 1024 * 1024),     // 4MB per stream window\n        grpc.InitialConnWindowSize(16 * 1024 * 1024), // 16MB connection window\n        grpc.MaxConcurrentStreams(1000),             // Throttle stream count to prevent ingress buffer exhaust\n    )\n    \n    grpcServer.Serve(lis)\n}",
    "verification": "Deploy the updated gRPC service behind Kubernetes Ingress. Execute load tests with `ghz` or `k6` using high stream concurrency (`--concurrency=100 --streams=50`). Inspect Envoy metrics `envoy_http_downstream_cx_rx_bytes_buffered` to ensure window replenishment occurs without memory allocation drop spikes.",
    "date": "2026-07-25",
    "id": 1784957731,
    "type": "error"
});