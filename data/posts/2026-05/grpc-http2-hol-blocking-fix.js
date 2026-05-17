window.onPostDataLoaded({
    "title": "Mitigating gRPC HTTP/2 Head-of-Line Blocking",
    "slug": "grpc-http2-hol-blocking-fix",
    "language": "Go",
    "code": "DeadlineExceeded",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>While HTTP/2 solves the application-layer Head-of-Line (HOL) blocking found in HTTP/1.1 via multiplexing, it still suffers from TCP-level HOL blocking. In high-loss network environments (common in multi-zone Kubernetes clusters), a single dropped TCP packet stalls all multiplexed gRPC streams on that connection.</p><p>This manifests as 'Deadline Exceeded' errors even when server CPU and memory are healthy, because the underlying pipe is clogged by a single retransmission wait.</p>",
    "root_cause": "Multiplexing too many active gRPC streams over a single TCP connection in a lossy network.",
    "bad_code": "// Single connection for all requests\nconn, _ := grpc.Dial(\"service:8080\", grpc.WithInsecure())\nclient := pb.NewServiceClient(conn)\nfor i := 0; i < 10000; i++ {\n    go client.DoWork(ctx, req) // All multiplexed on 1 TCP conn\n}",
    "solution_desc": "Implement client-side connection pooling to spread streams across multiple TCP connections. This limits the blast radius of a single dropped packet and increases total throughput.",
    "good_code": "// Use a pool of connections (e.g., using a library or custom wrapper)\nvar pool []*grpc.ClientConn\nfor i := 0; i < 8; i++ {\n    c, _ := grpc.Dial(\"service:8080\", grpc.WithInsecure())\n    pool = append(pool, c)\n}\n\n// Round-robin selection\nconn := pool[requestCounter % len(pool)]\nclient := pb.NewServiceClient(conn)",
    "verification": "Monitor the 'grpc_client_msg_sent_latency' bucket. A reduction in the P99 tail latency during packet loss simulation confirms the fix.",
    "date": "2026-05-17",
    "id": 1778998423,
    "type": "error"
});