window.onPostDataLoaded({
    "title": "Resolving gRPC Head-of-Line Blocking in HTTP/2",
    "slug": "grpc-http2-hol-blocking-resolution",
    "language": "Go",
    "code": "GRPC-HOL-002",
    "tags": [
        "Go",
        "Backend",
        "Infrastructure",
        "Error Fix"
    ],
    "analysis": "<p>Although HTTP/2 multiplexes multiple streams over a single TCP connection, it still suffers from TCP-level Head-of-Line (HOL) blocking. If a single packet is lost, all streams on that connection are stalled until the packet is retransmitted. In high-concurrency gRPC environments, a single 'fat' stream can also saturate the HTTP/2 flow control window, slowing down other latency-sensitive requests.</p><p>This is particularly problematic in cross-region communication where packet loss is more frequent.</p>",
    "root_cause": "A single TCP connection being used for all gRPC traffic, coupled with default flow-control window sizes that are too small for high-bandwidth streams.",
    "bad_code": "// Single connection shared across thousands of goroutines\nconn, _ := grpc.Dial(\"api.service.local:50051\", grpc.WithInsecure())\nclient := pb.NewServiceClient(conn)",
    "solution_desc": "Implement a client-side connection pool to spread streams across multiple underlying TCP connections and increase the initial window sizes for both the connection and individual streams to prevent flow-control bottlenecks.",
    "good_code": "// Increasing window sizes and utilizing multiple connections\nopts := []grpc.DialOption{\n\tgrpc.WithInitialWindowSize(1 << 20), // 1MB\n\tgrpc.WithInitialConnWindowSize(1 << 20),\n\tgrpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(1024 * 1024 * 16)),\n}\n// Use a helper to maintain a pool of *grpc.ClientConn\nconns := connectPool(\"api.service.local:50051\", 8, opts...)",
    "verification": "Use 'ghz' or a similar benchmarking tool to measure p99 latency under load while simulating 1% packet loss using 'tc-netem'.",
    "date": "2026-05-01",
    "id": 1777623412,
    "type": "error"
});