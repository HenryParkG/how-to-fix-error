window.onPostDataLoaded({
    "title": "Mitigating gRPC Go Flow-Control Deadlocks",
    "slug": "grpc-go-flow-control-deadlock-fix",
    "language": "Go",
    "code": "FlowControlDeadlock",
    "tags": [
        "Go",
        "gRPC",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In bidirectional gRPC streaming, both client and server manage flow-control windows. A deadlock occurs when the receiver's buffer is full, causing it to stop reading from the transport. If the sender is also blocked trying to write to the same transport because the window is exhausted, neither side can progress to clear the buffers.</p>",
    "root_cause": "The root cause is a synchronous processing loop where a 'Send' call blocks while waiting for window updates that can only be triggered by a 'Recv' call that is currently stuck.",
    "bad_code": "for {\n    req, _ := stream.Recv()\n    // Processing blocks, and Send is called synchronously\n    stream.Send(&Response{Data: process(req)})\n}",
    "solution_desc": "Decouple the Read and Write loops into separate goroutines. Use buffered channels to handle internal pressure and ensure that 'Recv' is always active to consume incoming frames and update the HTTP/2 flow-control window.",
    "good_code": "go func() {\n    for {\n        req, err := stream.Recv()\n        if err != nil { return }\n        inputChan <- req\n    }\n}()\n\nfor res := range outputChan {\n    if err := stream.Send(res); err != nil { break }\n}",
    "verification": "Simulate high-latency, high-throughput traffic using 'ghz' or a custom load tester and monitor the 'grpc_server_handling_seconds' metric for infinite spikes.",
    "date": "2026-02-28",
    "id": 1772270293,
    "type": "error"
});