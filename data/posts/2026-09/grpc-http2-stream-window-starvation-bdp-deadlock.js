window.onPostDataLoaded({
    "title": "gRPC HTTP/2: Stream Window Starvation and BDP Deadlocks",
    "slug": "grpc-http2-stream-window-starvation-bdp-deadlock",
    "language": "Go",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "gRPC",
        "Go",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>HTTP/2 provides multiplexed streams over a single TCP connection, enforcing credit-based flow control at both the connection and per-stream levels. When transmitting high-volume streaming payloads over cross-region links or high-latency Kubernetes service meshes, the default 64KB flow control window becomes an acute bottleneck.</p><p>If the Bandwidth-Delay Product (BDP) of the network link significantly exceeds the client or server window allocations, sender queues saturate before `WINDOW_UPDATE` frames return. In bidirectional or concurrent streaming scenarios, this causes stream window starvation. In extreme cases, blocked control messages or head-of-line payload chunks trigger mutual dependency deadlocks where neither peer can emit frames to advance the receiver window.</p>",
    "root_cause": "Default HTTP/2 flow control window limits (65,535 bytes) are exhausted by high BDP network topologies, stalling stream processing due to delayed WINDOW_UPDATE acknowledgments.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"net\"\n)\n\nfunc startServer() {\n\t// Default gRPC server has a 64KB initial stream window\n\t// Inadequate for multi-megabyte streams over WAN\n\tsrv := grpc.NewServer()\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\tsrv.Serve(lis)\n}",
    "solution_desc": "Explicitly configure `InitialWindowSize` (per-stream) and `InitialConnWindowSize` (per-connection) to match the expected Bandwidth-Delay Product (BDP = Bandwidth * RoundTripTime). Enable gRPC automated BDP probing algorithm (`grpc.BDP`) or set manual window buffers between 4MB and 16MB along with keepalive client/server enforcement to detect broken idle sessions.",
    "good_code": "package main\n\nimport (\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nfunc startServer() {\n\tconst (\n\t\tstreamWindow = 4 * 1024 * 1024  // 4MB per stream\n\t\tconnWindow   = 16 * 1024 * 1024 // 16MB per connection\n\t)\n\n\tsrv := grpc.NewServer(\n\t\tgrpc.InitialWindowSize(streamWindow),\n\t\tgrpc.InitialConnWindowSize(connWindow),\n\t\tgrpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{\n\t\t\tMinTime:             15 * time.Second,\n\t\t\tPermitWithoutStream: true,\n\t\t}),\n\t)\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\tsrv.Serve(lis)\n}",
    "verification": "Inspect gRPC trace output by setting environment variables `GODEBUG=http2debug=2` or `GRPC_GO_LOG_SEVERITY_LEVEL=info`. Verify steady `WINDOW_UPDATE` emissions in Wireshark and observe sustained streaming throughput without throughput collapse or client timeout drops.",
    "date": "2026-09-13",
    "id": 1789265273,
    "type": "error"
});