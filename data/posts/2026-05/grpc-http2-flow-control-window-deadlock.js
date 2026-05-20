window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Window Deadlocks",
    "slug": "grpc-http2-flow-control-window-deadlock",
    "language": "Go",
    "code": "gRPCDeadlock",
    "tags": [
        "Go",
        "Backend",
        "gRPC",
        "Error Fix"
    ],
    "analysis": "<p>gRPC leverages HTTP/2 multiplexing to run concurrent streams over a single TCP connection. When processing high-throughput payloads, default flow control window sizes (typically 64KB) can cause severe Head-of-Line (HoL) blocking and complete deadlocks.</p><p>If a receiver processes data slower than the sender transmits, the local stream window falls to zero. This halts all sibling streams on the same multiplexed connection until a WINDOW_UPDATE packet is dispatched.</p>",
    "root_cause": "Static, low-capacity flow control windows easily saturate under heavy streaming. If a single consumer slows down, the shared TCP-level window drops to zero, blocking concurrent requests on the same physical pipe.",
    "bad_code": "package main\n\nimport (\n    \"google.golang.org/grpc\"\n    \"net\"\n)\n\nfunc main() {\n    lis, _ := net.Listen(\"tcp\", \":50051\")\n    // Instantiating gRPC server using default, highly restrictive window sizes (64KB)\n    s := grpc.NewServer()\n    if err := s.Serve(lis); err != nil {\n        panic(err)\n    }\n}",
    "solution_desc": "Explicitly configure 'InitialWindowSize' and 'InitialConnWindowSize' on both gRPC clients and servers to support the network's bandwidth-delay product (BDP), enabling dynamic auto-tuning windows.",
    "good_code": "package main\n\nimport (\n    \"google.golang.org/grpc\"\n    \"google.golang.org/grpc/keepalive\"\n    \"net\"\n    \"time\"\n)\n\nfunc main() {\n    lis, _ := net.Listen(\"tcp\", \":50051\")\n    \n    // Optimize stream and connection buffers to handle throughput spikes\n    opts := []grpc.ServerOption{\n        grpc.InitialWindowSize(1024 * 1024 * 4),      // 4MB stream-level window\n        grpc.InitialConnWindowSize(1024 * 1024 * 8),    // 8MB connection-level window\n        grpc.KeepaliveParams(keepalive.ServerParameters{\n            MaxConnectionIdle:     15 * time.Second,\n            MaxConnectionAge:      30 * time.Minute,\n            Time:                  5 * time.Second,\n            Timeout:               2 * time.Second,\n        }),\n    }\n    \n    s := grpc.NewServer(opts...)\n    if err := s.Serve(lis); err != nil {\n        panic(err)\n    }\n}",
    "verification": "Profile network interactions with 'GODEBUG=http2debug=2' and verify that WINDOW_UPDATE commands are transmitted before stream buffers empty completely.",
    "date": "2026-05-20",
    "id": 1779277406,
    "type": "error"
});