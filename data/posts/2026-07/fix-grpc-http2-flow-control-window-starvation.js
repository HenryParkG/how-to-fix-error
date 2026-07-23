window.onPostDataLoaded({
    "title": "Fix gRPC HTTP/2 Flow Control Window Starvation",
    "slug": "fix-grpc-http2-flow-control-window-starvation",
    "language": "Go",
    "code": "Flow Control",
    "tags": [
        "Go",
        "gRPC",
        "HTTP/2",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>Under heavy concurrency, high-throughput gRPC streaming RPCs suffer severe throughput degradation and latency spikes due to HTTP/2 flow control window starvation. HTTP/2 maintains connection-level and stream-level flow control windows (defaulting to 64KB). When hundreds of multiplexed streams flood a single TCP connection, streaming response frames quickly exhaust stream and connection window credits faster than <code>WINDOW_UPDATE</code> frames can be sent and processed, completely stalling active streams under load.</p>",
    "root_cause": "Insufficient initial window sizes and default flow control settings failing to scale under high-concurrency stream multiplexing.",
    "bad_code": "import \"google.golang.org/grpc\"\n\n// Default gRPC server uses 64KB initial flow control windows\nsrv := grpc.NewServer()\n// Stalls under high multiplexed concurrency",
    "solution_desc": "Configure larger explicit initial stream and connection window sizes (`InitialWindowSize` and `InitialConnWindowSize`) on both client and server transports.",
    "good_code": "import \"google.golang.org/grpc\"\n\nsrv := grpc.NewServer(\n    grpc.InitialWindowSize(2 * 1024 * 1024),     // 2MB stream window\n    grpc.InitialConnWindowSize(16 * 1024 * 1024), // 16MB connection window\n)",
    "verification": "Benchmark multiplexed streams using high-concurrency tooling like `ghz` or `h2load` and monitor gRPC transport metrics to ensure zero HTTP/2 flow control window blockages occur under peak load.",
    "date": "2026-07-23",
    "id": 1784804449,
    "type": "error"
});