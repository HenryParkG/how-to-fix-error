window.onPostDataLoaded({
    "title": "Mitigating gRPC Flow Control Deadlocks in Microservices",
    "slug": "grpc-flow-control-deadlocks-microservices",
    "language": "Go",
    "code": "gRPCDeadlock",
    "tags": [
        "Go",
        "gRPC",
        "Docker",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high fan-out gRPC architectures, a single slow consumer can cause a deadlock across the entire connection. gRPC (over HTTP/2) uses a credit-based flow control mechanism.</p><p>If a service sends data to multiple streams and one stream's receive window becomes full (because the client is slow), the shared connection window can eventually reach zero. This stops all data flow on that connection, even for fast consumers.</p>",
    "root_cause": "The default HTTP/2 stream window size (typically 64KB) is too small for high-throughput microservices, causing senders to block synchronously when buffers fill up.",
    "bad_code": "s := grpc.NewServer()\n// Default settings lead to flow control exhaustion\npb.RegisterMyServiceServer(s, &server{})\n\nfunc (s *server) StreamData(req *pb.Req, stream pb.MyService_StreamDataServer) error {\n    for data := range dataChan {\n        // Blocks here if client is slow, potentially locking the conn\n        if err := stream.Send(data); err != nil {\n            return err\n        }\n    }\n    return nil\n}",
    "solution_desc": "Increase the InitialWindowSize and InitialConnWindowSize settings in the gRPC server and client configurations to allow more in-flight data. Implement a timeout or a non-blocking sender with a buffer to prevent a single stream from stalling the server.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 * 1024 * 1024), // 1MB\n    grpc.InitialConnWindowSize(4 * 1024 * 1024), // 4MB\n)\n\nfunc (s *server) StreamData(req *pb.Req, stream pb.MyService_StreamDataServer) error {\n    ctx, cancel := context.WithTimeout(stream.Context(), time.Second * 5)\n    defer cancel()\n    \n    // Business logic with context-aware sending\n    return nil\n}",
    "verification": "Monitor the 'grpc.server.msg_sent_total' and 'grpc.server.msg_dropped_total' metrics. Use 'h2spec' to verify HTTP/2 window behavior under load.",
    "date": "2026-05-12",
    "id": 1778584398,
    "type": "error"
});