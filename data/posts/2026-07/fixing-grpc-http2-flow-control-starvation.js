window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow-Control Stalls in High-Throughput",
    "slug": "fixing-grpc-http2-flow-control-starvation",
    "language": "Go",
    "code": "ResourceExhausted",
    "tags": [
        "gRPC",
        "HTTP/2",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput microservices using gRPC under extreme load often suffer from severe latency spikes or unexplained request timeouts. This failure mode frequently stems from HTTP/2 flow-control window exhaustion at either the stream or connection level. HTTP/2 enforces receiver-driven flow control using `WINDOW_UPDATE` frames to prevent fast senders from overwhelming slow receivers.</p><p>By default, gRPC implementations employ dynamic connection and stream initial window sizes (typically 64KB). When streams exchange large data payloads or multiplex thousands of concurrent requests across a single TCP transport connection, the default flow control limits exhaust rapidly. Senders enter a blocked state waiting for stream-level `WINDOW_UPDATE` signals, causing worker thread starvation and artificial backpressure stalls.</p>",
    "root_cause": "Inadequate HTTP/2 Initial Window Size and Initial Connection Window Size limits relative to the service's Bandwidth-Delay Product (BDP), causing transport write stalls.",
    "bad_code": "package main\n\nimport (\n\t\"net\"\n\t\"google.golang.org/grpc\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t// Bug: Default gRPC server settings use standard 64KB HTTP/2 flow-control windows,\n\t// leading to stalls under high-throughput multiplexed streaming.\n\tsrv := grpc.NewServer()\n\t_ = srv.Serve(lis)\n}",
    "solution_desc": "Configure custom gRPC server and client transport parameters. Increase `InitialWindowSize` (stream level) and `InitialConnWindowSize` (connection level) based on calculated Bandwidth-Delay Product (BDP), and enable dynamic window sizing via BDP estimators.",
    "good_code": "package main\n\nimport (\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t\n\t// Tune HTTP/2 window sizes to match high bandwidth requirements (e.g., 8MB streams / 16MB conn)\n\toptStreamWindow := grpc.InitialWindowSize(8 * 1024 * 1024)\n\toptConnWindow := grpc.InitialConnWindowSize(16 * 1024 * 1024)\n\t\n\tkeepaliveOpt := grpc.KeepaliveParams(keepalive.ServerParameters{\n\t\tMaxConnectionIdle:     15 * time.Minute,\n\t\tTime:                  30 * time.Second,\n\t\tTimeout:               10 * time.Second,\n\t})\n\n\tsrv := grpc.NewServer(\n\t\toptStreamWindow,\n\t\toptConnWindow,\n\t\tkeepaliveOpt,\n\t)\n\t_ = srv.Serve(lis)\n}",
    "verification": "Execute workload stress tests using `ghz` with high concurrency (e.g., 500 workers) and stream sizes >1MB. Inspect metrics using `grpc_client_sent_bytes_per_rpc` and confirm zero dynamic window starvation errors or TCP stream blockages.",
    "date": "2026-07-29",
    "id": 1785289489,
    "type": "error"
});