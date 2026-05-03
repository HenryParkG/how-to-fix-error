window.onPostDataLoaded({
    "title": "Eliminating gRPC Stream Stalls from HTTP/2 Exhaustion",
    "slug": "grpc-http2-flow-control-window-stalls",
    "language": "Go",
    "code": "Stream Stall",
    "tags": [
        "Go",
        "Infra",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>gRPC relies on HTTP/2, which implements flow control at both the stream and connection levels. If a consumer is slower than the producer, the HTTP/2 'Window' size decreases to zero, effectively halting the data flow. Default window sizes (64KB) are often insufficient for high-latency or high-bandwidth networks, leading to frequent stalls even when bandwidth is available.</p>",
    "root_cause": "The HTTP/2 flow control window is too small for the Bandwidth-Delay Product (BDP) of the network, or the application layer is not draining the buffer fast enough.",
    "bad_code": "// Default configuration often leads to stalls on fast networks\ns := grpc.NewServer()\nconn, err := grpc.Dial(addr, grpc.WithInsecure())",
    "solution_desc": "Increase the initial window and connection window sizes in both the client dial options and server parameters. Enabling BDP estimation (Keepalive) allows gRPC to dynamically adjust these windows.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20), // 1MB\n    grpc.InitialConnWindowSize(1 << 20),\n    grpc.KeepaliveParams(keepalive.ServerParameters{Time: 10 * time.Second}),\n)\n\nopts := []grpc.DialOption{\n    grpc.WithInitialWindowSize(1 << 20),\n    grpc.WithInitialConnWindowSize(1 << 20),\n}",
    "verification": "Use environment variable 'GODEBUG=http2debug=2' to monitor WINDOW_UPDATE frames and ensure they are sent before the window reaches zero.",
    "date": "2026-05-03",
    "id": 1777794522,
    "type": "error"
});