window.onPostDataLoaded({
    "title": "Resolving gRPC Stream Deadlocks in HTTP/2 Exhaustion",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "StreamHang",
    "tags": [
        "Go",
        "Backend",
        "Node.js",
        "Error Fix"
    ],
    "analysis": "<p>gRPC utilizes HTTP/2 as its transport layer, which employs both stream-level and connection-level flow control windows. A deadlock occurs when a client sends a large payload that exhausts the server's receive window. If the server application is blocked waiting for the client to send more data (or vice versa) while the underlying HTTP/2 layer is waiting for a WINDOW_UPDATE frame that can't be processed because the read loop is blocked, the entire stream hangs indefinitely.</p>",
    "root_cause": "The application-level processing loop blocks the transport-level flow control signaling, preventing the window from expanding.",
    "bad_code": "func (s *server) StreamData(stream pb.Data_StreamDataServer) error {\n    for {\n        req, err := stream.Recv()\n        if err != nil { return err }\n        // Latent processing without a separate goroutine\n        // blocks the gRPC internal read loop.\n        process(req)\n        stream.Send(&pb.Res{})\n    }\n}",
    "solution_desc": "Decouple the reading and processing logic using buffered channels. This ensures that 'Recv()' is called frequently enough to allow the gRPC internal library to send 'WINDOW_UPDATE' frames back to the sender, keeping the HTTP/2 pipeline flowing.",
    "good_code": "func (s *server) StreamData(stream pb.Data_StreamDataServer) error {\n    resCh := make(chan *pb.Res, 100)\n    go func() {\n        for res := range resCh {\n            stream.Send(res)\n        }\n    }()\n    for {\n        req, err := stream.Recv()\n        if err == io.EOF { return nil }\n        if err != nil { return err }\n        resCh <- process(req)\n    }\n}",
    "verification": "Use 'GRPC_TRACE=flow_control,http cargo run' to monitor window size updates and ensure they do not drop to zero for extended periods.",
    "date": "2026-04-05",
    "id": 1775381583,
    "type": "error"
});