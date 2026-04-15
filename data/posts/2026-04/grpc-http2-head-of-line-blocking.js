window.onPostDataLoaded({
    "title": "Resolving gRPC Head-of-Line Blocking in HTTP/2 Streams",
    "slug": "grpc-http2-head-of-line-blocking",
    "language": "Go",
    "code": "Network Congestion",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>gRPC leverages HTTP/2 multiplexing to send multiple requests over a single TCP connection. However, if a single TCP packet is lost, the entire connection stalls until the packet is retransmitted, causing all multiplexed gRPC streams to wait. This is known as TCP-level Head-of-Line (HOL) blocking.</p>",
    "root_cause": "While HTTP/2 solves application-layer HOL blocking, it remains vulnerable to TCP-layer HOL blocking because the underlying transport treats all multiplexed streams as a single byte stream.",
    "bad_code": "// Single connection for all high-concurrency traffic\nconn, _ := grpc.Dial(\"service:50051\", grpc.WithInsecure())\nclient := pb.NewServiceClient(conn)\nfor i := 0; i < 1000; i++ {\n    go client.DoWork(ctx, req)\n}",
    "solution_desc": "Implement client-side connection pooling to spread gRPC streams across multiple TCP connections. This limits the impact of a single packet loss to a subset of the traffic.",
    "good_code": "// Example of creating a pool of gRPC connections\nvar pool []*grpc.ClientConn\nfor i := 0; i < 8; i++ {\n    c, _ := grpc.Dial(\"service:50051\", grpc.WithInsecure())\n    pool = append(pool, c)\n}\n// Round-robin pick a connection from the pool\nconn := pool[rand.Intn(len(pool))]\nclient := pb.NewServiceClient(conn)",
    "verification": "Use 'tc' (traffic control) to simulate 1% packet loss and measure the 99th percentile latency; pooled connections should show significantly lower jitter.",
    "date": "2026-04-15",
    "id": 1776230157,
    "type": "error"
});