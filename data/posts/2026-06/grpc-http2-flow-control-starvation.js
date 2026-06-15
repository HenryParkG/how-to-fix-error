window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow Control Window Starvation",
    "slug": "grpc-http2-flow-control-starvation",
    "language": "Go",
    "code": "FlowControlError",
    "tags": [
        "Go",
        "Backend",
        "gRPC",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput gRPC streaming services running on networks with a high Bandwidth-Delay Product (BDP) can suffer severe throughput degradation due to HTTP/2 flow control window starvation. HTTP/2 uses a credit-based flow control mechanism where the receiver advertises how many bytes of data it is willing to buffer (the window size).</p><p>If the client or server defaults are kept too low (often 64KB), the sender exhausts this window buffer rapidly. The sender then blocks, waiting for a <code>WINDOW_UPDATE</code> frame from the receiver. This delay stalls streaming pipelines, resulting in suboptimal resource usage and restricted throughput.</p>",
    "root_cause": "The default initial connection and stream flow control window sizes are too small to saturate high-throughput, high-latency network paths, causing processing pipelines to stall while waiting for window updates.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"net\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t// Starvation: Server initialized with default flow control settings (~64KB)\n\ts := grpc.NewServer()\n\tif err := s.Serve(lis); err != nil {\n\t\tpanic(err)\n\t}\n}",
    "solution_desc": "Configure larger custom values for both the Initial Window Size and Initial Connection Window Size in your gRPC Server and Client configuration parameters. Scaling these windows to sizes such as 1MB or 4MB ensures that the sender does not stall while waiting for acknowledgment frames.",
    "good_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"net\"\n)\n\nconst (\n\t// Use 4MB for high-throughput stream flow window allocation\n\tinitialWindowSize     = 1 << 22\n\tinitialConnWindowSize = 1 << 22\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t// Correct: Optimize HTTP/2 flow control parameters for high throughput\n\ts := grpc.NewServer(\n\t\tgrpc.InitialWindowSize(initialWindowSize),\n\t\tgrpc.InitialConnWindowSize(initialConnWindowSize),\n\t)\n\tif err := s.Serve(lis); err != nil {\n\t\tpanic(err)\n\t}\n}",
    "verification": "Utilize network diagnostic tools like Wireshark or capture gRPC trace logs using `GRPC_GO_LOG_SEVERITY_LEVEL=info` to verify the absence of stalled TCP streams and confirm rapid `WINDOW_UPDATE` frames execution.",
    "date": "2026-06-15",
    "id": 1781491690,
    "type": "error"
});