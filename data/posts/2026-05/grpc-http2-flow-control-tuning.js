window.onPostDataLoaded({
    "title": "Tuning gRPC HTTP/2 Windows to Fix Stream Starvation",
    "slug": "grpc-http2-flow-control-tuning",
    "language": "Go",
    "code": "FLOW_CONTROL_ERROR",
    "tags": [
        "Go",
        "Backend",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput gRPC streaming applications, the default HTTP/2 flow control window (typically 64KB) can cause 'starvation'. On high-latency links, the sender exhausts the window before receiving a WINDOW_UPDATE frame from the receiver, leading to idle CPU cycles and throttled throughput even when bandwidth is available. This effectively caps the speed to (WindowSize / RoundTripTime).</p>",
    "root_cause": "The default HTTP/2 flow control window size is smaller than the Bandwidth-Delay Product (BDP) of the network path.",
    "bad_code": "s := grpc.NewServer()\n// Default settings used, providing only 64KB window\npb.RegisterServiceServer(s, &server{})",
    "solution_desc": "Manually increase the InitialWindowSize and InitialConnWindowSize on both the client and server to match the expected BDP of your network environment.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20),     // 1MB per stream\n    grpc.InitialConnWindowSize(1 << 22), // 4MB per connection\n)\n// Client side\nconn, _ := grpc.Dial(addr, \n    grpc.WithInitialWindowSize(1 << 20),\n    grpc.WithInitialConnWindowSize(1 << 22),\n)",
    "verification": "Use 'ghz' or 'benchmark' tools to measure throughput; verify that 'WINDOW_UPDATE' frames are sent less frequently and throughput matches line speed.",
    "date": "2026-05-10",
    "id": 1778392547,
    "type": "error"
});