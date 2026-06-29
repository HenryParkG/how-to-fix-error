window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlocks",
    "language": "Go",
    "code": "Deadlock",
    "tags": [
        "Go",
        "Backend",
        "gRPC",
        "Error Fix"
    ],
    "analysis": "<p>HTTP/2 flow control is built around window size allocations managed at both the connection and stream levels. In gRPC, multiplexed streams share a single underlying TCP connection. If a slow stream consumer halts processing without actively reading bytes off the buffer, its stream-level flow control window drops to zero. If the client or server fails to handle this pause correctly, it can lead to stream starvation.</p><p>The issue worsens under high concurrency: if multiple active streams exhaust their windows simultaneously and the master connection window becomes fully saturated, the whole HTTP/2 frame reader loop can freeze. This creates a distributed deadlock where control frames (such as dynamic window updates or settings frames) cannot be processed because the connection-level buffer is completely exhausted. Consequently, all streams sharing that TCP socket block indefinitely.</p>",
    "root_cause": "The combination of low default Initial Window Sizes (65KB) with slow synchronous stream processing blocks the TCP buffer. This exhausts the shared connection-level flow-control window, preventing the transmission of HTTP/2 WINDOW_UPDATE control frames.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"net\"\n)\n\nfunc main() {\n\t// BUG: Relying on default connection and stream window sizes\n\t// which are highly susceptible to deadlock under high-bandwidth, high-latency streams\n\tserver := grpc.NewServer()\n\t\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\tserver.Serve(lis)\n}",
    "solution_desc": "Explicitly configure 'InitialWindowSize' and 'InitialConnWindowSize' to match your network's Bandwidth-Delay Product (BDP). Implement active keepalive parameters on both sides to automatically recalculate and dynamically resize connection windows and enforce reading processing in separate non-blocking goroutines.",
    "good_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n\t\"net\"\n\t\"time\"\n)\n\nfunc main() {\n\t// FIX: Explicitly expand window sizes to avoid starvation and add Keepalive dynamic adjustments\n\tserver := grpc.NewServer(\n\t\tgrpc.InitialWindowSize(1024 * 1024 * 4),      // 4MB stream-level window\n\t\tgrpc.InitialConnWindowSize(1024 * 1024 * 16),  // 16MB connection-level window\n\t\tgrpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{\n\t\t\tMinTime:             5 * time.Second,\n\t\t\tPermitWithoutStream: true,\n\t\t}),\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tMaxConnectionIdle: 15 * time.Minute,\n\t\t\tTime:              20 * time.Second,\n\t\t\tTimeout:           10 * time.Second,\n\t\t}),\n\t)\n\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\tserver.Serve(lis)\n}",
    "verification": "Utilize environment variables 'GODEBUG=http2debug=2' and monitor gRPC client and server metrics 'grpc_server_msg_received_total' alongside active socket buffer sizing via TCP dump to verify that HTTP/2 WINDOW_UPDATE frames are continuously emitted under load.",
    "date": "2026-06-29",
    "id": 1782737923,
    "type": "error"
});