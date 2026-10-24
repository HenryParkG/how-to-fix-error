window.onPostDataLoaded({
    "title": "Fix gRPC Deadlocks Caused by HTTP/2 Flow-Control Starvation",
    "slug": "fix-grpc-deadlock-http2-flow-control-starvation",
    "language": "Go",
    "code": "StreamFlowControlDeadlock",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "gRPC",
        "Error Fix"
    ],
    "analysis": "<p>gRPC relies on HTTP/2 for multiplexing multiple logical RPC streams across a single underlying TCP connection. HTTP/2 introduces transport flow control at both the connection and individual stream levels using <code>WINDOW_UPDATE</code> frames. When a gRPC client or server streams large payloads without consuming or acknowledging incoming chunks promptly, the sender's flow-control window shrinks to zero.</p><p>Deadlocks frequently materialize in bidirectional streaming topologies or reverse proxy ingress controllers when the caller performs synchronous, interleaved read/write operations on the same stream, or when the consumer waits for an upstream confirmation before draining the current gRPC read buffer. If the sender saturates the receiver's window, the sender's <code>SendMsg</code> blocks. If the receiver is also blocking on a synchronous write back to the sender (or waiting on another bounded buffer), both endpoints freeze indefinitely, triggering zero throughput without an error or connection drop.</p>",
    "root_cause": "Synchronous, coupled send-and-receive loops exhaust HTTP/2 stream flow-control windows, causing bidirectional gRPC endpoints to simultaneously block on write operations while waiting for counterpart window updates.",
    "bad_code": "func (s *ProxyServer) BidirectionalPipe(stream pb.Service_BidirectionalPipeServer) error {\n    for {\n        // BUG: Blocking receive halts pipeline; if downstream sender window\n        // is exhausted, neither side drains HTTP/2 frame buffers.\n        req, err := stream.Recv()\n        if err == io.EOF { return nil }\n        if err != nil { return err }\n\n        processed := expensiveProcessing(req)\n\n        // Synchronous send blocks if client's HTTP/2 receive window is 0\n        if err := stream.Send(processed); err != nil {\n            return err\n        }\n    }\n}",
    "solution_desc": "Decouple reading and writing using separate goroutines and bounded buffering. In addition, configure gRPC flow-control window settings via `grpc.InitialWindowSize` and `grpc.InitialConnWindowSize` to ensure throughput matches link bandwidth-delay products (BDP).",
    "good_code": "func (s *ProxyServer) BidirectionalPipe(stream pb.Service_BidirectionalPipeServer) error {\n    ctx, cancel := context.WithCancel(stream.Context())\n    defer cancel()\n    outCh := make(chan *pb.Response, 64)\n    errCh := make(chan error, 2)\n\n    // Dedicated writer goroutine decouples downstream window from upstream ingestion\n    go func() {\n        for {\n            select {\n            case <-ctx.Done():\n                return\n            case resp, ok := <-outCh:\n                if !ok { return }\n                if err := stream.Send(resp); err != nil {\n                    errCh <- err\n                    return\n                }\n            }\n        }\n    }()\n\n    for {\n        req, err := stream.Recv()\n        if err == io.EOF {\n            close(outCh)\n            return nil\n        }\n        if err != nil {\n            return err\n        }\n        \n        select {\n        case outCh <- expensiveProcessing(req):\n        case err := <-errCh:\n            return err\n        case <-ctx.Done():\n            return ctx.Err()\n        }\n    }\n}",
    "verification": "Monitor `grpc_server_handling_seconds` and check `netstat -tn` for persistent Recv-Q/Send-Q buffer stagnation. Trace frames with `GODEBUG=http2debug=2` to ensure continuous `WINDOW_UPDATE` issuance.",
    "date": "2026-10-24",
    "id": 1792828269,
    "type": "error"
});