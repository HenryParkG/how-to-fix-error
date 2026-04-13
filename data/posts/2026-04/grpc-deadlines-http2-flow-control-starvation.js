window.onPostDataLoaded({
    "title": "Mitigating gRPC Deadlines from HTTP/2 Flow Control Starvation",
    "slug": "grpc-deadlines-http2-flow-control-starvation",
    "language": "Go",
    "code": "DEADLINE_EXCEEDED",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In multi-tier proxy architectures (e.g., NGINX to Envoy to App), gRPC requests often suffer from DEADLINE_EXCEEDED errors despite low backend latency. This is frequently caused by HTTP/2 flow control starvation. When a proxy's window size is exhausted, it stops sending data frames, but because gRPC is multiplexed, one slow consumer or a small window can block the entire connection's throughput, causing timeouts.</p>",
    "root_cause": "The default HTTP/2 initial window size (64KB) is too small for high-bandwidth paths, leading to TCP buffer saturation and head-of-line blocking at the application level.",
    "bad_code": "server := grpc.NewServer()\n// Using default window sizes which are highly restrictive",
    "solution_desc": "Manually tune the InitialWindowSize and InitialConnWindowSize for both the gRPC client and server to at least 1MB or higher depending on the Bandwidth-Delay Product (BDP). Also, ensure proxies have matching window increments.",
    "good_code": "server := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20), // 1MB\n    grpc.InitialConnWindowSize(1 << 20),\n    grpc.KeepaliveParams(keepalive.ServerParameters{Time: 10 * time.Second}),\n)",
    "verification": "Check 'grpc_client_sent_messages_total' vs 'grpc_server_handled_total' and monitor HTTP/2 WINDOW_UPDATE frames via tcpdump.",
    "date": "2026-04-13",
    "id": 1776076022,
    "type": "error"
});