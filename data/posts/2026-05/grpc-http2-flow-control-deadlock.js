window.onPostDataLoaded({
    "title": "Resolving gRPC HTTP/2 Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "FlowControlBlocking",
    "tags": [
        "Go",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput gRPC services can experience sudden hangs where the client and server stop communicating despite healthy network connections. This occurs when the HTTP/2 stream-level flow control window is exhausted because a consumer is slow, eventually filling the connection-level window and blocking all other concurrent streams on that same TCP connection.</p>",
    "root_cause": "The default HTTP/2 window size (64KB) is insufficient for high-BDP (Bandwidth-Delay Product) networks, causing senders to block while waiting for WINDOW_UPDATE frames that are delayed by processing overhead.",
    "bad_code": "s := grpc.NewServer()\n// Using default settings for high-throughput link\n// No explicit flow control configuration\nlis, _ := net.Listen(\"tcp\", \":50051\")\ns.Serve(lis)",
    "solution_desc": "Increase the InitialWindowSize and InitialConnWindowSize for both the client and server. This allows more data to be 'in-flight' before requiring an acknowledgment, preventing head-of-line blocking at the flow-control level.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20),     // 1MB per stream\n    grpc.InitialConnWindowSize(1 << 22), // 4MB per connection\n)\n// Ensure client matches settings\nconn, _ := grpc.Dial(addr, \n    grpc.WithInitialWindowSize(1 << 20),\n    grpc.WithInitialConnWindowSize(1 << 22),\n)",
    "verification": "Use 'ghz' to load test with high concurrency. Observe 'grpc_server_handled_total' metrics; the fix is verified if throughput remains constant without latency spikes when processing slow streams.",
    "date": "2026-05-06",
    "id": 1778032717,
    "type": "error"
});