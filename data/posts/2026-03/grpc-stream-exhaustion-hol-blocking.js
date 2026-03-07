window.onPostDataLoaded({
    "title": "Fix gRPC Stream Exhaustion & Head-of-Line Blocking",
    "slug": "grpc-stream-exhaustion-hol-blocking",
    "language": "Go",
    "code": "ResourceExhausted",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-concurrency microservices, gRPC leverages HTTP/2 multiplexing to send multiple requests over a single TCP connection. However, when the <code>MAX_CONCURRENT_STREAMS</code> limit is reached (defaulting often to 100), new requests are queued, leading to perceived latency. Furthermore, TCP-level Head-of-Line (HOL) blocking occurs when a single packet loss stalls all multiplexed streams on that connection, creating a bottleneck that can cascade through a service mesh.</p>",
    "root_cause": "The bottleneck is caused by strict HTTP/2 stream limits and the inherent limitation of TCP where lost packets block the entire transport window, compounded by default gRPC settings that don't aggressively manage connection pooling.",
    "bad_code": "conn, err := grpc.Dial(address, grpc.WithInsecure())\nif err != nil {\n    log.Fatalf(\"did not connect: %v\", err)\n}\n// Using a single connection for thousands of concurrent goroutines\nclient := pb.NewTelemetryClient(conn)",
    "solution_desc": "Implement a client-side connection pool to spread load across multiple TCP connections and tune the server's concurrent stream settings. Additionally, adjust Keepalive parameters to detect and prune stale connections early.",
    "good_code": "func NewClientPool(target string, size int) []*grpc.ClientConn {\n    pool := make([]*grpc.ClientConn, size)\n    for i := 0; i < size; i++ {\n        c, _ := grpc.Dial(target, \n            grpc.WithKeepaliveParams(keepalive.ClientParameters{\n                Time: 10 * time.Second,\n                Timeout: time.Second,\n                PermitWithoutStream: true,\n            }),\n            grpc.WithInitialWindowSize(1 << 30),\n        )\n        pool[i] = c\n    }\n    return pool\n}",
    "verification": "Use 'ghz' or 'k6' to simulate high concurrency and monitor 'grpc_server_handled_total' with code 'ResourceExhausted' in Prometheus.",
    "date": "2026-03-07",
    "id": 1772845861,
    "type": "error"
});