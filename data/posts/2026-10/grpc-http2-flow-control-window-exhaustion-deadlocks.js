window.onPostDataLoaded({
    "title": "Fixing gRPC HTTP/2 Flow-Control Window Deadlocks",
    "slug": "grpc-http2-flow-control-window-exhaustion-deadlocks",
    "language": "Go",
    "code": "HTTP2_FLOW_CONTROL_ERROR",
    "tags": [
        "Go",
        "Docker",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>gRPC multiplexes multiple concurrent RPC streams across a single persistent TCP connection using the HTTP/2 framing layer. HTTP/2 enforces flow control at two distinct levels: per-stream flow control and connection-level flow control (via <code>WINDOW_UPDATE</code> frames).</p><p>When a server transmits large streaming payloads across multiple multiplexed streams, but a single downstream client stream consumes bytes slowly or stalls on downstream disk/network I/O, the connection-level window is rapidly consumed by unacknowledged frames. Because connection-level flow control is shared across all concurrent RPC streams on that transport, the entire connection window hits zero. Even fast, independent RPC streams multiplexed over that same connection are blocked from transmitting data, leading to head-of-line blocking and cascading microservice deadlocks.</p>",
    "root_cause": "The HTTP/2 transport connection-level window (defaulting to 64KB in unoptimized gRPC stacks) is exhausted because a slow stream fails to consume data and trigger WINDOW_UPDATE frames, starving all other multiplexed streams sharing the single transport connection.",
    "bad_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"log\"\n\t\"net\"\n)\n\nfunc main() {\n\tlis, err := net.Listen(\"tcp\", \":50051\")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\t// Default settings allocate 64KB connection and stream windows.\n\t// Highly multiplexed, unbalanced streams will exhaust the transport window.\n\tsrv := grpc.NewServer()\n\tlog.Fatal(srv.Serve(lis))\n}",
    "solution_desc": "Increase both stream and connection flow-control windows via InitialWindowSize and InitialConnWindowSize. Decouple stream reading on the receiver using asynchronous worker channels to drain transport buffers rapidly and emit WINDOW_UPDATE frames immediately.",
    "good_code": "package main\n\nimport (\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n\t\"log\"\n\t\"net\"\n\t\"time\"\n)\n\nfunc main() {\n\tlis, err := net.Listen(\"tcp\", \":50051\")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\n\tsrv := grpc.NewServer(\n\t\t// Expand HTTP/2 windows based on BDP (Bandwidth-Delay Product)\n\t\tgrpc.InitialWindowSize(4 * 1024 * 1024),     // 4MB per-stream window\n\t\tgrpc.InitialConnWindowSize(16 * 1024 * 1024), // 16MB connection-wide window\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tMaxConnectionIdle: 15 * time.Minute,\n\t\t\tTimeout:           10 * time.Second,\n\t\t}),\n\t)\n\n\tlog.Fatal(srv.Serve(lis))\n}",
    "verification": "Collect network traces via Wireshark or use `GODEBUG=http2debug=2` to observe HTTP/2 frame transactions. Confirm that `WINDOW_UPDATE` frames scale dynamically and that connection-level available credits remain positive under heavy asynchronous stream multiplexing.",
    "date": "2026-10-17",
    "id": 1792221611,
    "type": "error"
});