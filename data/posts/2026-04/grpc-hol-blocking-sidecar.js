window.onPostDataLoaded({
    "title": "Resolving gRPC HoL Blocking in HTTP/2 Sidecar Proxies",
    "slug": "grpc-hol-blocking-sidecar",
    "language": "Go",
    "code": "LatencySpike",
    "tags": [
        "Go",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In microservice architectures using sidecar proxies (like Envoy or Istio), gRPC traffic is multiplexed over a limited number of HTTP/2 TCP connections. While multiplexing is efficient, it suffers from Head-of-Line (HoL) blocking at the transport layer: if a single TCP packet is dropped or delayed, all concurrent gRPC streams on that connection stall until the packet is retransmitted.</p><p>In high-throughput telemetry or logging sidecars, this manifests as sudden, synchronized latency spikes across dozens of unrelated RPC calls. This negates the benefits of HTTP/2 multiplexing under poor network conditions or high packet loss environments.</p>",
    "root_cause": "Excessive multiplexing of high-volume gRPC streams over a single TCP connection, causing transport-layer HoL blocking when packet loss occurs.",
    "bad_code": "// Standard single-connection client\nconn, _ := grpc.Dial(\"sidecar:50051\", grpc.WithInsecure())\nclient := pb.NewTelemetryClient(conn)\n\nfor i := 0; i < 1000; i++ {\n    go client.Send(ctx, &pb.Data{Val: i})\n} // All 1000 streams share ONE TCP pipe",
    "solution_desc": "Implement a connection pool for the gRPC client to distribute streams across multiple underlying TCP connections. Additionally, tune the 'MaxConcurrentStreams' and 'InitialWindowSize' to prevent single-stream saturation from affecting the whole pipe.",
    "good_code": "// Connection pooling implementation\nvar pool []*grpc.ClientConn\nfor i := 0; i < 8; i++ {\n    c, _ := grpc.Dial(\"sidecar:50051\", grpc.WithInsecure())\n    pool = append(pool, c)\n}\n\n// Distribute load\nidx := atomic.AddUint64(&counter, 1) % 8\nclient := pb.NewTelemetryClient(pool[idx])\nclient.Send(ctx, data)",
    "verification": "Simulate packet loss using 'tc-netem' (Traffic Control) and monitor P99 latency. Metrics should show a reduction in 'tail latency' compared to a single-connection setup.",
    "date": "2026-04-22",
    "id": 1776842492,
    "type": "error"
});