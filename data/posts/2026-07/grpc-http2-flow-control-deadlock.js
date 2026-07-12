window.onPostDataLoaded({
    "title": "Fix gRPC HTTP/2 Flow Control Deadlock & Starvation",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "gRPC Flow Control Deadlock",
    "tags": [
        "Go",
        "gRPC",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>When using gRPC over HTTP/2, both connection-level and stream-level flow control windows limit how much data can be in-flight before receiver confirmation (WINDOW_UPDATE). If a high-throughput streaming RPC server encounters a slow consumer on one stream, that stream's window fills up. However, due to shared transport buffers and connection-level flow control, this slow stream can exhaust the entire connection's credit pool. This starves adjacent concurrent streams multiplexed over the same TCP connection and leads to a cascading flow control deadlock.</p>",
    "root_cause": "gRPC's default HTTP/2 implementation halts reading from the transport buffer if stream-level buffers are full, but fails to drain connection-level windows. Under heavy write conditions, this blocks the entire connection-level window update loop, preventing other healthy streams on the same connection from receiving flow control credits.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"net\"\n)\n\nfunc main() {\n\t// Buggy: Using defaults allows flow control exhaustion\n\t// when single streams block reading.\n\tlistener, _ := net.Listen(\"tcp\", \":50051\")\n\tsrv := grpc.NewServer() \n\t_ = srv.Serve(listener)\n}",
    "solution_desc": "Configure custom connection-level and stream-level flow control windows (InitialWindowSize and InitialConnWindowSize) during gRPC server initialization. Additionally, enforce transport-level keepalive and active stream limits to force connection recycling and prevent long-lived stagnant streams from starving active ones.",
    "good_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n\t\"net\"\n\t\"time\"\n)\n\nfunc main() {\n\tlistener, err := net.Listen(\"tcp\", \":50051\")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n\t// Solve deadlock by configuring window sizes & keepalive policies\n\tsrv := grpc.NewServer(\n\t\tgrpc.InitialWindowSize(1 * 1024 * 1024),     // 1MB per stream\n\t\tgrpc.InitialConnWindowSize(8 * 1024 * 1024), // 8MB per connection\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tMaxConnectionIdle:     15 * time.Minute,\n\t\t\tMaxConnectionAge:      30 * time.Minute,\n\t\t\tMaxConnectionAgeGrace: 5 * time.Second,\n\t\t\tTime:                  20 * time.Second,\n\t\t\tTimeout:               10 * time.Second,\n\t\t}),\n\t)\n\t\n\tif err := srv.Serve(listener); err != nil {\n\t\tpanic(err)\n\t}\n}",
    "verification": "Simulate a slow-reading client along with 5 fast-reading clients. Measure the throughput of fast clients. The fast clients should retain baseline throughput without dropping to 0 packets/sec when the slow client's buffers fill.",
    "date": "2026-07-12",
    "id": 1783843257,
    "type": "error"
});