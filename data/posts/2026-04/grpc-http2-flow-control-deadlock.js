window.onPostDataLoaded({
    "title": "gRPC: Resolving HTTP/2 Stream Starvation",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "StreamStarvation",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency gRPC services, developers often encounter a scenario where some requests hang indefinitely while the CPU and memory usage remain low. This is typically 'Stream Starvation.' HTTP/2 uses flow control at both the stream and connection levels. If a single client stream is slow to consume data, it can fill the entire connection-level window, effectively blocking all other multiplexed streams on that same TCP connection.</p>",
    "root_cause": "The default HTTP/2 flow control window size (64KB) is too small for high-latency or high-bandwidth networks. When the connection-level flow control window is exhausted, no further data can be sent for any stream until a WindowUpdate frame is received.",
    "bad_code": "s := grpc.NewServer()\n// No custom keepalive or window settings\npb.RegisterServiceServer(s, &server{})",
    "solution_desc": "Increase the initial window size and connection window size to accommodate larger bandwidth-delay products (BDP). Implement server-side keepalive to detect and close dead connections that might be holding onto window quotas.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20),     // 1MB\n    grpc.InitialConnWindowSize(1 << 22), // 4MB\n    grpc.KeepaliveParams(keepalive.ServerParameters{\n        MaxConnectionIdle: 5 * time.Minute,\n    }),\n)",
    "verification": "Use the `GRPC_GO_LOG_SEVERITY_LEVEL=info` environment variable and `netstat` to observe window size updates and ensure streams are not blocking for longer than expected.",
    "date": "2026-04-27",
    "id": 1777287230,
    "type": "error"
});