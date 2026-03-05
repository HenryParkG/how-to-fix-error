window.onPostDataLoaded({
    "title": "Resolving gRPC Head-of-Line Blocking in HTTP/2 Flow Control",
    "slug": "grpc-http2-hol-blocking-flow-control",
    "language": "Go",
    "code": "StreamStall",
    "tags": [
        "Go",
        "Backend",
        "gRPC",
        "Error Fix"
    ],
    "analysis": "<p>HTTP/2 multiplexes multiple streams over a single TCP connection, which prevents connection-level Head-of-Line (HOL) blocking. However, it introduces stream-level flow control. If a gRPC client stops consuming a specific stream (due to slow processing), the HTTP/2 WINDOW_UPDATE frames aren't sent. Eventually, the sender's flow-control window for that stream exhausts, stalling the stream. If the connection-level window is also small, a single slow stream can eventually consume the entire connection's quota, stalling all other concurrent gRPC calls on that same connection.</p>",
    "root_cause": "The default HTTP/2 flow control window (64KB) is often too small for high-bandwidth, high-latency links, causing buffers to fill faster than they are drained.",
    "bad_code": "// Using default window sizes in a high-throughput environment\ns := grpc.NewServer()\n// No specific FlowControl parameters set,\n// defaulting to 64KB per stream.",
    "solution_desc": "Increase the InitialWindowSize and InitialConnWindowSize in the gRPC server and client configurations. This allows more 'data in flight' before requiring an acknowledgment, effectively decoupling the throughput from the RTT.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20),     // 1MB per stream\n    grpc.InitialConnWindowSize(1 << 22), // 4MB per connection\n)\n\n// On the client side:\nconn, _ := grpc.Dial(addr, \n    grpc.WithInitialWindowSize(1 << 20),\n    grpc.WithInitialConnWindowSize(1 << 22),\n)",
    "verification": "Monitor the 'grpc.server.msg_sent_rate' and check for 'WINDOW_UPDATE' frequency using Wireshark to ensure the window isn't constantly hitting zero.",
    "date": "2026-03-05",
    "id": 1772684981,
    "type": "error"
});