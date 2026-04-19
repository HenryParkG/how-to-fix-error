window.onPostDataLoaded({
    "title": "Resolving gRPC Flow Control Deadlocks in Go Streams",
    "slug": "grpc-flow-control-deadlocks",
    "language": "Go",
    "code": "StreamDeadlock",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In bi-directional gRPC streaming, both client and server are subject to HTTP/2 flow control. A deadlock occurs when a producer fills the outbound flow-control window and blocks on a write, while the consumer at the other end is also blocked trying to write to the same channel, neither side consuming data to clear the windows.</p>",
    "root_cause": "Reciprocal blocking where the send-buffer is full on both sides, and neither goroutine is concurrently draining the receive-buffer.",
    "bad_code": "for {\n    if err := stream.Send(msg); err != nil { return err }\n    resp, err := stream.Recv() // Blocked: Send is waiting for window update\n}",
    "solution_desc": "Decouple the reading and writing logic into separate goroutines. Use a buffered channel to handle outbound messages and always ensure the Recv() loop is running independently to update the flow control window.",
    "good_code": "go func() {\n    for { \n        msg, _ := stream.Recv()\n        process(msg)\n    }\n}()\nfor msg := range outChannel {\n    stream.Send(msg)\n}",
    "verification": "Load test with high-latency links and small 'InitialWindowSize' to confirm that the stream does not hang under saturation.",
    "date": "2026-04-19",
    "id": 1776591568,
    "type": "error"
});