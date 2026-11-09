window.onPostDataLoaded({
    "title": "Fix gRPC HTTP/2 Flow Control Starvation & Deadlock",
    "slug": "grpc-http2-flow-control-window-starvation",
    "language": "Go",
    "code": "DEADLINE_EXCEEDED",
    "tags": [
        "gRPC",
        "HTTP2",
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput gRPC streaming architectures multiplex multiple logical RPC streams over a single underlying TCP connection using HTTP/2 framing. HTTP/2 enforces flow control at both the individual stream level and the connection level through <code>WINDOW_UPDATE</code> control frames. If unconsumed data fills the client or server receive buffer, the available window size decrements to zero.</p><p>When downstream consumers perform blocking I/O or encounter thread pool starvation while processing an individual stream, stream-level window updates stall. If multiple multiplexed streams exhaust their individual allocations without replenishing connection-level credits, the entire connection window locks. Consequently, unrelated concurrent RPCs across the same transport freeze, triggering cascading <code>DEADLINE_EXCEEDED</code> timeouts and cross-stream deadlocks.</p>",
    "root_cause": "Unbounded streaming payloads combined with slow consumers stall HTTP/2 WINDOW_UPDATE emission; default connection and stream window sizes (64KB) fail to match the network Bandwidth-Delay Product (BDP), stalling all multiplexed RPCs on the transport.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"net\"\n\t\"google.golang.org/grpc\"\n\tpb \"example.com/stream\"\n)\n\ntype server struct{ pb.UnimplementedDataServiceServer }\n\nfunc (s *server) StreamData(stream pb.DataService_StreamDataServer) error {\n\tfor {\n\t\treq, err := stream.Recv()\n\t\tif err != nil { return err }\n\t\t// Blocking synchronous operation directly in the receive loop\n\t\t// Window credits are not returned promptly, causing connection-level stall\n\t\tslowExternalDatabaseCall(req.GetPayload())\n\t}\n}\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\ts := grpc.NewServer() // Default window sizes: 64KB (rapidly exhausted)\n\tpb.RegisterDataServiceServer(s, &server{})\n\ts.Serve(lis)\n}",
    "solution_desc": "Tune HTTP/2 flow control window sizes (InitialWindowSize and InitialConnWindowSize) to match the BDP (e.g., 2MB to 8MB). Offload heavy stream processing to decoupled buffered worker pools to ensure stream reads continuously drain transport frames, and configure gRPC keepalive parameters to proactively detect and teardown half-dead multiplexed sockets.",
    "good_code": "package main\n\nimport (\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n\tpb \"example.com/stream\"\n)\n\ntype server struct{ pb.UnimplementedDataServiceServer }\n\nfunc (s *server) StreamData(stream pb.DataService_StreamDataServer) error {\n\tjobChan := make(chan []byte, 100) // Buffer to decouple transport from work\n\tgo func() {\n\t\tfor payload := range jobChan {\n\t\t\tslowExternalDatabaseCall(payload)\n\t\t}\n\t}()\n\tdefer close(jobChan)\n\n\tfor {\n\t\treq, err := stream.Recv()\n\t\tif err != nil { return err }\n\t\tjobChan <- req.GetPayload() // Unblocks Recv() instantly, maintaining HTTP/2 window updates\n\t}\n}\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\ts := grpc.NewServer(\n\t\tgrpc.InitialWindowSize(2 * 1024 * 1024),     // 2MB per-stream window\n\t\tgrpc.InitialConnWindowSize(8 * 1024 * 1024), // 8MB connection-level window\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tTime:    20 * time.Second,\n\t\t\tTimeout: 5 * time.Second,\n\t\t}),\n\t)\n\tpb.RegisterDataServiceServer(s, &server{})\n\ts.Serve(lis)\n}",
    "verification": "Enable gRPC HTTP/2 tracing via `GODEBUG=http2debug=2` and verify incoming `WINDOW_UPDATE` frames scale dynamically with load. Confirm that connection-level stream queues stay below threshold and RPC latencies remain flat under saturation.",
    "date": "2026-11-09",
    "id": 1794196214,
    "type": "error"
});