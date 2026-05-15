window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlocks-proxy",
    "language": "Go",
    "code": "HTTP2FlowDeadlock",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>gRPC utilizes HTTP/2, which implements both stream-level and connection-level flow control via WINDOW_UPDATE frames. In multi-hop proxy chains (e.g., Envoy to an internal Go microservice), a deadlock can occur if the intermediate proxy's buffer fills up and the downstream service stops consuming data. If the upstream proxy keeps receiving data but cannot forward it, its internal window drops to zero. If the application logic requires a bidirectional exchange where the sender is blocked by flow control before it can read the next response, the entire chain halts.</p>",
    "root_cause": "Mismatched buffer sizes and default window settings (64KB) that are too small for high-latency or high-throughput multi-hop paths.",
    "bad_code": "s := grpc.NewServer()\n// Using default parameters in a high-load proxy environment\n// often leads to window exhaustion.\npb.RegisterServiceServer(s, &server{})",
    "solution_desc": "Increase the InitialWindowSize and InitialConnWindowSize on both the client and server sides to allow more in-flight data. This prevents the flow control window from hitting zero prematurely during bursty traffic.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20),     // 1MB per stream\n    grpc.InitialConnWindowSize(1 << 20), // 1MB per connection\n)\npb.RegisterServiceServer(s, &server{})",
    "verification": "Monitor the 'grpc.http2.pings_sent' and window size metrics in Prometheus. Ensure that 'WINDOW_UPDATE' frames are being sent frequently and the window never stays at 0 for extended periods.",
    "date": "2026-05-15",
    "id": 1778811130,
    "type": "error"
});