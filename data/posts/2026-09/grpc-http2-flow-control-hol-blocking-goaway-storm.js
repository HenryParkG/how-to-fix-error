window.onPostDataLoaded({
    "title": "Fix gRPC HTTP/2 Flow-Control HOL & GOAWAY Storms",
    "slug": "grpc-http2-flow-control-hol-blocking-goaway-storm",
    "language": "Go",
    "code": "RESOURCE_EXHAUSTED",
    "tags": [
        "Go",
        "gRPC",
        "Kubernetes",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>gRPC multiplexes concurrent RPCs over long-lived HTTP/2 TCP connections. HTTP/2 maintains distinct flow-control mechanisms at both the stream level and the global connection level using credit-based window allocations (<code>WINDOW_UPDATE</code> frames). When a downstream gRPC consumer reads messages slower than the producer transmits, stream-level buffer saturation causes stream-level credits to drop to zero.</p><p>Because multiple concurrent RPCs share the same underlying TCP connection, a stalled stream or unoptimized global window size exhausts connection-level flow-control credits. This introduces transport-level Head-of-Line (HOL) blocking: high-priority fast RPCs become blocked waiting for transport credits held up by slow streaming consumers. In Kubernetes deployments fronted by Envoy or ingress gateways, reaching stream capacity or timeout thresholds triggers HTTP/2 <code>GOAWAY</code> frames. This initiates reconnection storms, connection churn, and cascades of <code>RESOURCE_EXHAUSTED</code> errors across the microservice mesh.</p>",
    "root_cause": "Multiplexing slow, high-throughput streams over default 64KB HTTP/2 flow-control windows depletes the shared connection credit window, causing cross-stream Head-of-Line blocking and triggering gateway GOAWAY resets.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"net\"\n\t\"google.golang.org/grpc\"\n\tpb \"example.com/telemetry\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t// Default server options use 64KB flow control windows and no connection limits\n\tsrv := grpc.NewServer()\n\tpb.RegisterTelemetryServer(srv, &server{})\n\t_ = srv.Serve(lis)\n}\n\ntype server struct {\n\tpb.UnimplementedTelemetryServer\n}\n\nfunc (s *server) StreamMetrics(srv pb.Telemetry_StreamMetricsServer) error {\n\tfor {\n\t\t// Slow consumer unbuffered read blocks the entire HTTP/2 shared transport credit\n\t\treq, err := srv.Recv()\n\t\tif err != nil {\n\t\t\treturn err\n\t\t}\n\t\tprocessExpensiveMetric(req)\n\t}\n}",
    "solution_desc": "Architecturally expand HTTP/2 stream and connection window buffers using `InitialWindowSize` and `InitialConnWindowSize`. Configure transport keep-alive and max connection age with randomization (jitter) to prevent synchronized GOAWAY disconnect storms. Isolate heavy streaming RPCs onto dedicated client subchannels rather than multiplexing them alongside low-latency unary control planes.",
    "good_code": "package main\n\nimport (\n\t\"math/rand\"\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n\tpb \"example.com/telemetry\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\n\tsrv := grpc.NewServer(\n\t\t// Expand flow-control windows to prevent stream/conn HOL credit stall\n\t\tgrpc.InitialWindowSize(1024 * 1024),     // 1MB per stream\n\t\tgrpc.InitialConnWindowSize(8 * 1024 * 1024), // 8MB per connection\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tMaxConnectionAge:      30 * time.Minute,\n\t\t\tMaxConnectionAgeGrace: 5 * time.Minute,\n\t\t\tTime:                  1 * time.Minute,\n\t\t\tTimeout:               20 * time.Second,\n\t\t}),\n\t\tgrpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{\n\t\t\tMinTime:             20 * time.Second,\n\t\t\tPermitWithoutStream: true,\n\t\t}),\n\t)\n\n\tpb.RegisterTelemetryServer(srv, &server{})\n\t_ = srv.Serve(lis)\n}",
    "verification": "Monitor `grpc_server_handled_total{grpc_code=\"ResourceExhausted\"}` and track HTTP/2 frame metrics via network tracing (`nghttp2` / Wireshark). Verify that `WINDOW_UPDATE` frames scale proportionally with traffic and that zero unexpected `GOAWAY` frames occur during concurrent stress tests.",
    "date": "2026-09-05",
    "id": 1788592442,
    "type": "error"
});