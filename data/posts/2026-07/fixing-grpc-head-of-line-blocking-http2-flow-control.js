window.onPostDataLoaded({
    "title": "Fixing gRPC Head-of-Line Blocking and Flow Control",
    "slug": "fixing-grpc-head-of-line-blocking-http2-flow-control",
    "language": "Go / gRPC",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "gRPC",
        "Go",
        "HTTP/2",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput gRPC services multiplexing many concurrent RPC streams over a single TCP connection frequently encounter application-level Head-of-Line (HoL) blocking. When a client consumes large streaming responses slowly, the HTTP/2 stream-level flow control window narrows to zero. Because the underlying HTTP/2 connection-level flow control window (`INITIAL_WINDOW_SIZE`) is shared across all concurrent streams on that connection, an exhausted window stalls latency-critical unary RPCs multiplexed over the same channel.</p>",
    "root_cause": "Default HTTP/2 connection and stream window sizes (64KB) are exhausted by bandwidth-heavy streaming responses, halting transmission of connection-level `WINDOW_UPDATE` frames and blocking latency-sensitive unary calls sharing the single TCP connection multiplexer.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"log\"\n)\n\nfunc main() {\n\t// BUG: Using default gRPC options sets small HTTP/2 window sizes (64KB)\n\t// A single slow streaming consumer will block all RPCs on this connection\n\tconn, err := grpc.Dial(\"localhost:50051\", grpc.WithInsecure())\n\tif err != nil {\n\t\tlog.Fatalf(\"Failed to connect: %v\", err)\n\t}\n\tdefer conn.Close()\n\t// Interleaved fast unary calls and huge streaming calls share 1 starved connection\n}",
    "solution_desc": "Architectural solution involves expanding HTTP/2 stream and connection flow control initial windows (`InitialWindowSize`, `InitialConnWindowSize`) to prevent window exhaustion, alongside creating a channel connection pool to isolate heavy streaming traffic from low-latency unary RPC traffic.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"log\"\n\t\"time\"\n\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/backoff\"\n\t\"google.golang.org/grpc/credentials/insecure\"\n)\n\nfunc createOptimizedChannel(target string) (*grpc.ClientConn, error) {\n\t// Fix: Tune HTTP/2 window sizes and configure client connection parameters\n\treturn grpc.Dial(\n\t\ttarget,\n\t\tgrpc.WithTransportCredentials(insecure.NewCredentials()),\n\t\tgrpc.WithInitialWindowSize(8*1024*1024),     // 8MB Stream window\n\t\tgrpc.WithInitialConnWindowSize(16*1024*1024), // 16MB Connection window\n\t\tgrpc.WithConnectParams(grpc.ConnectParams{\n\t\t\tBackoff: backoff.Config{\n\t\t\t\tBaseDelay:  1.0 * time.Second,\n\t\t\t\tMultiplier: 1.6,\n\t\t\t\tMaxDelay:   15 * time.Second,\n\t\t\t},\n\t\t\tMinConnectTimeout: 20 * time.Second,\n\t\t}),\n\t)\n}",
    "verification": "Execute workload with `GODEBUG=http2debug=2` set in environment. Verify through network traces that `WINDOW_UPDATE` frames are sent dynamically and that P99 RPC latency for unary calls remains low under heavy concurrent stream loads.",
    "date": "2026-07-27",
    "id": 1785133068,
    "type": "error"
});