window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Stream Exhaustion & Deadlocks",
    "slug": "fixing-grpc-http2-stream-exhaustion-deadlocks",
    "language": "Go / gRPC",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "Go",
        "gRPC",
        "HTTP/2",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput Go microservices using long-lived gRPC connections frequently encounter stream exhaustion (`rpc error: code = ResourceExhausted desc = concurrent items exceed limit`) or HTTP/2 flow control deadlocks. Under heavy load, single multiplexed HTTP/2 TCP connections hit the default `MAX_CONCURRENT_STREAMS` threshold (typically 100). When coupled with un-acknowledged HTTP/2 `WINDOW_UPDATE` frames from slow receivers, transport buffers fill completely, halting pending RPC invocations and hanging worker goroutines indefinitely.</p>",
    "root_cause": "A single gRPC TCP connection cannot scale beyond its MAX_CONCURRENT_STREAMS limit and initial flow-control window size (InitialWindowSize). Without transport connection pooling, keepalive frame settings, and active window tuning, concurrent goroutines deadlock waiting for connection stream slots.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n)\n\n// Buggy Client Setup: Single shared connection without window tuning or pooling\nfunc InitGRPCClient(target string) (pb.MetricsServiceClient, error) {\n\t// PROBLEM: Uses single connection with default 100 max streams and 65KB window size\n\tconn, err := grpc.Dial(target, grpc.WithInsecure())\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\treturn pb.NewMetricsServiceClient(conn), nil\n}",
    "solution_desc": "Implement a gRPC client transport pool to multiplex stream allocations across multiple TCP sockets. Configure HTTP/2 flow control windows (`InitialWindowSize`, `InitialConnWindowSize`) and enforce proactive keepalive ping policies to keep connection windows flushes clean under load.",
    "good_code": "package main\n\nimport (\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nconst (\n\tMB = 1024 * 1024\n)\n\nfunc NewOptimizedGRPCConn(target string) (*grpc.ClientConn, error) {\n\tkacp := keepalive.ClientParameters{\n\t\tTime:                10 * time.Second, // Send pings every 10s if idle\n\t\tTimeout:             3 * time.Second,  // Wait 3s for ping ack\n\t\tPermitWithoutStream: true,             // Send pings even without active streams\n\t}\n\n\treturn grpc.Dial(\n\t\ttarget,\n\t\tgrpc.WithInsecure(),\n\t\t// Fix: Scale HTTP/2 Stream and Connection Window sizes to 16MB\n\t\tgrpc.WithInitialWindowSize(16 * MB),\n\t\tgrpc.WithInitialConnWindowSize(32 * MB),\n\t\tgrpc.WithKeepaliveParams(kacp),\n\t)\n}",
    "verification": "Run benchmarking with `ghz` or `h2load` using 5,000+ concurrent workers targeting the gRPC endpoint. Verify zero `RESOURCE_EXHAUSTED` status codes and confirm latency distribution remains flat without hung goroutines.",
    "date": "2026-08-01",
    "id": 1785580074,
    "type": "error"
});