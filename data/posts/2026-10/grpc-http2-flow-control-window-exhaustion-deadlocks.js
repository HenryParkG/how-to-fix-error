window.onPostDataLoaded({
    "title": "Resolving gRPC HTTP/2 Flow-Control Window Deadlocks",
    "slug": "grpc-http2-flow-control-window-exhaustion-deadlocks",
    "language": "Go",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>gRPC transports multiplexed streams across a single long-lived TCP connection via HTTP/2 frames. HTTP/2 maintains two distinct flow-control credit limits: a stream-level window (governing payload consumption on individual RPC streams) and a connection-level window (governing payload across the multiplexed socket). By default, standard HTTP/2 initial window size is 65,535 bytes.</p><p>When a client initiates multiple concurrent streaming RPCs over the same transport and fails to continuously read or consume frames from one slow stream, the server continues sending DATA frames until the shared connection-level window is completely exhausted (credit drops to zero). Consequently, healthy streams multiplexed over that same connection cannot transmit or receive WINDOW_UPDATE frames, creating a transport-wide deadlock where all multiplexed RPCs stall indefinitely.</p>",
    "root_cause": "The shared HTTP/2 connection-level flow control window is consumed by slow or stalled consumer streams on a multiplexed transport, blocking all other streams due to absent WINDOW_UPDATE credits.",
    "bad_code": "// Client configured with standard default windows and slow consumption\nconn, err := grpc.Dial(\"backend.service:50051\", \n    grpc.WithInsecure(),\n    // Omitting flow control parameters leaves default 64KB window\n)\n\nstream, err := client.StreamLogs(ctx, &LogRequest{})\nfor {\n    msg, err := stream.Recv()\n    // Heavy synchronous block halts frame consumption without buffer release\n    time.Sleep(500 * time.Millisecond)\n    process(msg)\n}",
    "solution_desc": "Tune stream and connection flow control parameters (`InitialWindowSize` and `InitialConnWindowSize`) using keepalive client parameters. Offload message processing into asynchronous worker channels to immediately consume frames and emit HTTP/2 WINDOW_UPDATE frames back to the sender.",
    "good_code": "// Optimized gRPC Client with custom HTTP/2 flow-control buffer windows\nconn, err := grpc.Dial(\"backend.service:50051\",\n    grpc.WithTransportCredentials(insecure.NewCredentials()),\n    grpc.WithInitialWindowSize(1 * 1024 * 1024),     // 1MB per stream\n    grpc.WithInitialConnWindowSize(4 * 1024 * 1024), // 4MB per connection\n)\n\nmsgChan := make(chan *LogResponse, 1000)\ngo func() {\n    for msg := range msgChan {\n        process(msg)\n    }\n}()\n\n// Fast consumption loop keeps HTTP/2 stream and connection credits replenished\nfor {\n    msg, err := stream.Recv()\n    if err != nil { break }\n    msgChan <- msg\n}",
    "verification": "Enable gRPC trace logging via `GRPC_GO_LOG_SEVERITY_LEVEL=info` and `GODEBUG=http2debug=2`. Inspect window update logs to verify `WINDOW_UPDATE` frames are sent immediately and credit allocations do not dip to 0 under sustained 100MB/s stream load.",
    "date": "2026-10-29",
    "id": 1793275592,
    "type": "error"
});