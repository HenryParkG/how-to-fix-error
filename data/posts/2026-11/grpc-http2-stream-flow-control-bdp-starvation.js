window.onPostDataLoaded({
    "title": "Resolving gRPC HTTP/2 Flow-Control and BDP Starvation",
    "slug": "grpc-http2-stream-flow-control-bdp-starvation",
    "language": "Go",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "Go",
        "Kubernetes",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>gRPC uses HTTP/2 for multiplexing multiple concurrent streams over a single TCP connection. HTTP/2 enforces flow control via credit-based window allocations at both the connection level and individual stream level. The default initial window size defined by the HTTP/2 specification is 65,535 bytes (64 KB).</p><p>In cross-datacenter or high-bandwidth high-latency environments (high Bandwidth-Delay Product, or BDP), this default window is quickly exhausted. If a client sends data faster than the round-trip time (RTT) needed for the server to acknowledge bytes and return <code>WINDOW_UPDATE</code> frames, the stream stalls. Under high concurrent write volumes, buffers fill up, stream buffers block indefinitely, deadline timers expire with context timeouts, and client channels throw exhaustion errors.</p>",
    "root_cause": "Static default HTTP/2 stream and connection window limits (64KB) that under-provision network throughput relative to the connection's Bandwidth-Delay Product (BDP = Bandwidth \u00d7 RTT).",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"log\"\n\t\"net\"\n\t\"google.golang.org/grpc\"\n)\n\nfunc main() {\n\tlis, err := net.Listen(\"tcp\", \":50051\")\n\tif err != nil {\n\t\tlog.Fatalf(\"failed to listen: %v\", err)\n\t}\n\t// Relies on static 65,535-byte default HTTP/2 flow-control window\n\ts := grpc.NewServer()\n\tif err := s.Serve(lis); err != nil {\n\t\tlog.Fatalf(\"failed to serve: %v\", err)\n\t}\n}",
    "solution_desc": "Configure larger explicit window sizes for streams and connections using `InitialWindowSize` and `InitialConnWindowSize`. In Go's gRPC implementation, dynamic BDP probing is built into the transport layer, but it requires appropriate client and server keepalive and window configuration to scale up to megabyte-scale transport ceilings.",
    "good_code": "package main\n\nimport (\n\t\"log\"\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nconst (\n\t// Scale window sizes to handle high BDP networks (e.g. 100ms RTT @ 1Gbps ~ 12.5MB)\n\tinitialWindowSize     = 8 * 1024 * 1024  // 8MB per stream\n\tinitialConnWindowSize = 64 * 1024 * 1024 // 64MB per connection\n)\n\nfunc main() {\n\tlis, err := net.Listen(\"tcp\", \":50051\")\n\tif err != nil {\n\t\tlog.Fatalf(\"failed to listen: %v\", err)\n\t}\n\n\ts := grpc.NewServer(\n\t\tgrpc.InitialWindowSize(initialWindowSize),\n\t\tgrpc.InitialConnWindowSize(initialConnWindowSize),\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tMaxConnectionIdle: 5 * time.Minute,\n\t\t\tTime:              20 * time.Second,\n\t\t\tTimeout:           5 * time.Second,\n\t\t}),\n\t)\n\tif err := s.Serve(lis); err != nil {\n\t\tlog.Fatalf(\"failed to serve: %v\", err)\n\t}\n}",
    "verification": "Inspect frame transmission using `GODEBUG=http2debug=2` to observe `WINDOW_UPDATE` frames scaling past 64KB. Track gRPC client metrics `grpc.client.stream.sent_message_size` and monitor Prometheus HTTP/2 flow control stall durations to ensure sustained saturated line rate.",
    "date": "2026-11-16",
    "id": 1794801468,
    "type": "error"
});