window.onPostDataLoaded({
    "title": "Fix gRPC HTTP/2 Window Auto-Tuning Deadlocks",
    "slug": "fix-grpc-http2-window-auto-tuning-deadlocks",
    "language": "Go",
    "code": "HTTP2_FLOW_CONTROL_DEADLOCK",
    "tags": [
        "gRPC",
        "Microservices",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>Under high throughput in Go microservices, gRPC client and server connections can experience sudden stream stalls where active RPC requests hang indefinitely. This deadlock stems from HTTP/2 BDP (Bandwidth Delay Product) window auto-tuning mechanism interactions with stream concurrency limits and backpressure handling.</p><p>When gRPC's dynamic flow control attempts to adjust stream windows based on round-trip ping estimates, rapid payload bursts combined with unread stream buffers starve BDP calculations. The sender dynamic window size drops to zero while receiver handlers wait for ping updates queued behind backpressured buffers, creating a cyclic flow control deadlock.</p>",
    "root_cause": "Race condition in HTTP/2 dynamic BDP estimation where window capacity collapses to 0 during burst traffic, blocking high-priority BDP ping frames required to expand the window.",
    "bad_code": "package main\n\nimport (\n    \"google.golang.org/grpc\"\n)\n\nfunc NewServer() *grpc.Server {\n    // Default window auto-tuning can collapse under concurrent streaming bursts\n    return grpc.NewServer(\n        grpc.InitialWindowSize(65535),     // Static small stream window\n        grpc.InitialConnWindowSize(65535), // Static connection window\n    )\n}",
    "solution_desc": "Configure explicit, high-capacity HTTP/2 connection and stream flow-control windows along with aggressive keepalive ping parameters to ensure flow control update frames bypass data frame backpressure.",
    "good_code": "package main\n\nimport (\n    \"time\"\n    \"google.golang.org/grpc\"\n    \"google.golang.org/grpc/keepalive\"\n)\n\nfunc NewServer() *grpc.Server {\n    return grpc.NewServer(\n        grpc.InitialWindowSize(1024 * 1024 * 2),     // 2MB Stream Window\n        grpc.InitialConnWindowSize(1024 * 1024 * 16),  // 16MB Conn Window\n        grpc.KeepaliveParams(keepalive.ServerParameters{\n            Time:                  15 * time.Second,\n            Timeout:               5 * time.Second,\n            MaxConnectionAgeGrace: 10 * time.Second,\n        }),\n    )\n}",
    "verification": "Execute streaming load tests using `ghz` with `--concurrency=500`. Monitor stream state using `GODEBUG=http2debug=2` to ensure continuous exchange of WINDOW_UPDATE frames without stalling.",
    "date": "2026-08-04",
    "id": 1785821972,
    "type": "error"
});