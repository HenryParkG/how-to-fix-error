window.onPostDataLoaded({
    "title": "Fix gRPC Flow Control Deadlocks & Backpressure",
    "slug": "grpc-backpressure-flow-control-deadlocks",
    "language": "Go",
    "code": "ResourceExhausted",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>gRPC leverages HTTP/2 streams over a multiplexed TCP connection. Flow control operates at both the individual stream level and the shared connection level using window update frames (<code>WINDOW_UPDATE</code>). When a slow consumer fails to consume streaming messages promptly, its local stream receive window diminishes to zero.</p><p>If the sender continues to block synchronously inside stream dispatch loops without backpressure isolation, it fills the send buffer, stalls the entire HTTP/2 transport connection, and exhausts available worker threads, creating mutual deadlocks across all active streams multiplexed over that connection.</p>",
    "root_cause": "Unbounded synchronous writes against stalled HTTP/2 transport windows, consuming all flow control credits without rate limiting or asynchronous backpressure queues.",
    "bad_code": "func (s *EventServer) StreamEvents(req *pb.SubRequest, stream pb.EventService_StreamEventsServer) error {\n    for {\n        event := s.eventBus.GetNext()\n        // Bug: Synchronously blocks on slow network clients,\n        // freezing transport window and backing up event dispatchers.\n        if err := stream.Send(event); err != nil {\n            return err\n        }\n    }\n}",
    "solution_desc": "Implement non-blocking channel buffers paired with bounded worker pools. Monitor `stream.Context().Done()` and drop or reject messages with `codes.ResourceExhausted` when client consumption falls behind tolerable thresholds.",
    "good_code": "func (s *EventServer) StreamEvents(req *pb.SubRequest, stream pb.EventService_StreamEventsServer) error {\n    outQueue := make(chan *pb.Event, 256)\n    ctx := stream.Context()\n    \n    go s.eventBus.Subscribe(ctx, req.Topic, outQueue)\n    \n    for {\n        select {\n        case <-ctx.Done():\n            return ctx.Err()\n        case event, ok := <-outQueue:\n            if !ok {\n                return nil\n            }\n            if err := stream.Send(event); err != nil {\n                return status.Errorf(codes.Unavailable, \"send failed: %v\", err)\n            }\n        }\n    }\n}",
    "verification": "Enable HTTP/2 trace logging with `GODEBUG=http2debug=2`, monitor transport metrics `grpc.server.msg_sent` vs `grpc.server.msg_received`, and simulate network latency using `tc` to verify backpressure enforcement.",
    "date": "2026-08-22",
    "id": 1787369686,
    "type": "error"
});