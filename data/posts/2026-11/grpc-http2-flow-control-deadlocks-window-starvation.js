window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlocks-window-starvation",
    "language": "Go",
    "code": "FlowControlStarvation",
    "tags": [
        "Go",
        "Docker",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>gRPC relies on HTTP/2 multiplexed streams governed by connection-level and stream-level flow control windows (defaulting to 64KB). When a bidirectional streaming RPC pushes high volumes of data to a slow consumer, the remote receive window rapidly drops to zero, pausing outgoing frame writes.</p><p>If both endpoints employ synchronous, lock-dependent ping-pong patterns\u2014or if write routines block the goroutine tasked with processing inbound `WINDOW_UPDATE` frames\u2014a deadlock occurs. Neither peer can allocate flow control credit to clear the pipeline, resulting in stalled connections and eventual context deadline cancellations.</p>",
    "root_cause": "Coupled, synchronous reading and writing over a bidirectional HTTP/2 stream blocks internal window update processing when the peer's flow control receive buffer saturates.",
    "bad_code": "func (s *StreamService) Transfer(stream pb.Service_TransferServer) error {\n    for {\n        req, err := stream.Recv()\n        if err == io.EOF { return nil }\n        if err != nil { return err }\n\n        // Synchronous heavy write blocks here if client flow-control window is 0\n        // While blocked, the server cannot read subsequent WINDOW_UPDATE or client messages\n        if err := stream.Send(&pb.Response{Payload: process(req)}); err != nil {\n            return err\n        }\n    }\n}",
    "solution_desc": "Decouple reading and writing into independent goroutines using buffered Go channels, and adjust gRPC connection and stream window sizes via `keepalive` and `grpc.InitialWindowSize` options.",
    "good_code": "func (s *StreamService) Transfer(stream pb.Service_TransferServer) error {\n    outCh := make(chan *pb.Response, 100)\n    errCh := make(chan error, 2)\n\n    // Dedicated writer goroutine decouples flow control writes from reads\n    go func() {\n        for resp := range outCh {\n            if err := stream.Send(resp); err != nil {\n                errCh <- err\n                return\n            }\n        }\n        errCh <- nil\n    }()\n\n    // Dedicated reader ensures incoming WINDOW_UPDATE frames are handled\n    go func() {\n        defer close(outCh)\n        for {\n            req, err := stream.Recv()\n            if err == io.EOF { errCh <- nil; return }\n            if err != nil { errCh <- err; return }\n            outCh <- &pb.Response{Payload: process(req)}\n        }\n    }()\n\n    if err := <-errCh; err != nil && err != io.EOF {\n        return err\n    }\n    return <-errCh\n}",
    "verification": "Enable gRPC transport logging via `GODEBUG=http2debug=2` and observe frame traffic to verify `WINDOW_UPDATE` frames are exchanged continuously without `SETTINGS_INITIAL_WINDOW_SIZE` exhaustion.",
    "date": "2026-11-06",
    "id": 1793938809,
    "type": "error"
});