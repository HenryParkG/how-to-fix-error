window.onPostDataLoaded({
    "title": "Fixing gRPC Flow Control Deadlocks in Microservices",
    "slug": "grpc-flow-control-deadlock-nested",
    "language": "Go",
    "code": "HTTP/2 Flow Deadlock",
    "tags": [
        "Go",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In deeply nested microservice chains (A -> B -> C), gRPC can encounter flow control deadlocks. HTTP/2 uses window-based flow control at both the stream and connection levels. If service B is waiting for a response from service C, but its internal receive window for service A's data is full, and service A is waiting to send more data before processing B's response, the entire chain halts. This is exacerbated by default window sizes that are too small for high-latency or high-bandwidth cloud environments.</p>",
    "root_cause": "The HTTP/2 BDP (Bandwidth Delay Product) limit is reached, causing the sender to block on window updates that the receiver cannot provide because it is blocked downstream.",
    "bad_code": "// Default configuration\nconn, err := grpc.Dial(addr, grpc.WithInsecure())\n// Default InitialWindowSize is 65535, easily saturated in nested high-concurrency calls.",
    "solution_desc": "Increase the InitialWindowSize and InitialConnWindowSize in the gRPC server and client parameters. This allows more 'in-flight' data before requiring an ACK (window update), preventing the head-of-line blocking in the flow control layer.",
    "good_code": "const windowSize = 1 << 20 // 1MB\nserver := grpc.NewServer(\n    grpc.InitialWindowSize(windowSize),\n    grpc.InitialConnWindowSize(windowSize),\n)\n\nconn, err := grpc.Dial(addr, \n    grpc.WithInitialWindowSize(windowSize), \n    grpc.WithInitialConnWindowSize(windowSize),\n)",
    "verification": "Perform a stress test with 'ghz' or 'jmeter' across 3 hops. Monitor the 'grpc_server_handling_seconds' metric for outliers above the 99th percentile.",
    "date": "2026-03-15",
    "id": 1773537929,
    "type": "error"
});