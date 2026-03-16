window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "Deadlock",
    "tags": [
        "Go",
        "Backend",
        "Network",
        "Error Fix"
    ],
    "analysis": "<p>gRPC utilizes HTTP/2, which implements both stream-level and connection-level flow control. A deadlock occurs when a high-throughput stream exhausts its flow control window because the receiver is not consuming data fast enough, but the sender is blocked waiting for a window update that never arrives due to application-layer logic.</p><p>This is common in bidirectional streaming where the sender waits for a response before reading further, while the receiver's buffer is full, creating a circular dependency on the flow control window.</p>",
    "root_cause": "The HTTP/2 flow control window reaches zero, blocking the sender, while the receiver is blocked on an application-level synchronization primitive (like a mutex or channel) held by the sender.",
    "bad_code": "stream, _ := client.StreamData(ctx)\nfor {\n    err := stream.Send(&req) // Blocks when window is full\n    resp, _ := stream.Recv()  // Logic depends on send finishing\n}",
    "solution_desc": "Increase InitialWindowSize and InitialConnWindowSize in gRPC server/client parameters and ensure that Recv() is called in a separate goroutine from Send() to prevent head-of-line blocking.",
    "good_code": "opts := []grpc.ServerOption{\n    grpc.InitialWindowSize(1 << 20), // 1MB\n    grpc.InitialConnWindowSize(1 << 20),\n}\ns := grpc.NewServer(opts...)\n\n// In client: Run Recv in a goroutine\ngo func() {\n    for { res, err := stream.Recv() }\n}()",
    "verification": "Monitor 'grpc.http2.flow_control_window_size' metrics using Prometheus to detect window exhaustion.",
    "date": "2026-03-16",
    "id": 1773654992,
    "type": "error"
});