window.onPostDataLoaded({
    "title": "Fix gRPC HTTP/2 Stream Cancellation Memory Leaks",
    "slug": "fix-grpc-http2-stream-cancellation-memory-leaks",
    "language": "Go",
    "code": "gRPC Resource Leak",
    "tags": [
        "gRPC",
        "Go",
        "HTTP/2",
        "Microservices",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput gRPC streaming services in Go can experience steady memory leaks and goroutine growth when clients abruptly terminate or cancel HTTP/2 streams. If long-lived server streaming handlers do not explicitly monitor context cancellations when producing data, orphaned goroutines remain blocked indefinitely on channel sends or context bindings.</p>",
    "root_cause": "Server streaming handlers failing to select on `stream.Context().Done()` leave streaming routines listening or pushing to channels long after client RST_STREAM frames arrive, preventing GC sweep of stream state buffers and context tree nodes.",
    "bad_code": "func (s *Server) StreamMetrics(req *pb.MetricRequest, stream pb.Metrics_StreamMetricsServer) error {\n    metricChan := s.pubsub.Subscribe(req.TopicID)\n    \n    // Bug: Loop only exits when publisher closes channel or send errors\n    for metric := range metricChan {\n        if err := stream.Send(metric); err != nil {\n            return err\n        }\n    }\n    return nil\n}",
    "solution_desc": "Always bind the streaming loop to `stream.Context().Done()` using a select block and register cleanup routines with `defer` to ensure pub/sub subscriptions are closed immediately when the client cancels or times out.",
    "good_code": "func (s *Server) StreamMetrics(req *pb.MetricRequest, stream pb.Metrics_StreamMetricsServer) error {\n    ctx := stream.Context()\n    metricChan, unsubscribe := s.pubsub.Subscribe(req.TopicID)\n    defer unsubscribe()\n    \n    for {\n        select {\n        case <-ctx.Done():\n            return ctx.Err()\n        case metric, ok := <-metricChan:\n            if !ok {\n                return nil\n            }\n            if err := stream.Send(metric); err != nil {\n                return err\n            }\n        }\n    }\n}",
    "verification": "Expose `net/http/pprof` endpoints and monitor `runtime.NumGoroutine()` while executing heavy client cancellation tests (e.g., using `ghz` or custom integration tests sending rapid RST_STREAM frame disconnects).",
    "date": "2026-07-22",
    "id": 1784684791,
    "type": "error"
});