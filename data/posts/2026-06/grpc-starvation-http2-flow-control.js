window.onPostDataLoaded({
    "title": "Fixing gRPC Starvation from HTTP/2 Flow Control",
    "slug": "grpc-starvation-http2-flow-control",
    "language": "Go",
    "code": "FlowControlStarvation",
    "tags": [
        "Go",
        "Kubernetes",
        "Java",
        "Error Fix"
    ],
    "analysis": "<p>gRPC leverages the HTTP/2 protocol to multiplex multiple logical streams over a single TCP connection. To manage resource allocation and prevent fast senders from overwhelming slow receivers, HTTP/2 implements a local flow-control algorithm using windows. Every stream, as well as the aggregate connection, has a flow control window that limits the number of unacknowledged bytes a sender can transmit. The client or server advertises these windows and updates them using <code>WINDOW_UPDATE</code> frames as data is read from buffers.</p><p>When default flow control limits are left low (e.g., the standard 65KB) and a consumer is slow to read incoming payload blocks or process a high-volume stream, the window is quickly exhausted. Once the window hits zero, the sender stops transmitting data. Because of TCP multiplexing, this flow control stall on a single busy connection can starve and block adjacent concurrent streams on that same channel.</p>",
    "root_cause": "The gRPC connection exhausts its stream or connection-level window limits due to inadequate default flow control sizes paired with slow consumer reads, which halts frame delivery and causes connection starvation.",
    "bad_code": "package main\n\nimport (\n\t\"net\"\n\t\"google.golang.org/grpc\"\n)\n\nfunc main() {\n\tlis, _ := net.Listen(\"tcp\", \":50051\")\n\t// Default server settings initiate with a 65KB stream flow-control window\n\ts := grpc.NewServer()\n\t// Register services...\n\ts.Serve(lis)\n}",
    "solution_desc": "Explicitly tune and scale both the `InitialWindowSize` (per-stream flow control window) and the `InitialConnWindowSize` (per-connection flow control window) to values matching your network's Bandwidth-Delay Product (BDP). Additionally, configure TCP keepalive parameters to keep idle multiplexed channels active and healthy.",
    "good_code": "package main\n\nimport (\n\t\"net\"\n\t\"time\"\n\t\"google.golang.org/grpc\"\n\t\"google.golang.org/grpc/keepalive\"\n)\n\nfunc main() {\n\tlis, err := net.Listen(\"tcp\", \":50051\")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n\t// Optimize settings to avoid window exhaustion (e.g., 4MB stream / 8MB connection)\n\topts := []grpc.ServerOption{\n\t\tgrpc.InitialWindowSize(1 << 22),     // 4MB per stream\n\t\tgrpc.InitialConnWindowSize(1 << 23), // 8MB per connection\n\t\tgrpc.KeepaliveParams(keepalive.ServerParameters{\n\t\t\tMaxConnectionIdle:     15 * time.Minute,\n\t\t\tMaxConnectionAge:      30 * time.Minute,\n\t\t\tMaxConnectionAgeGrace: 10 * time.Second,\n\t\t\tTime:                  2 * time.Hour,\n\t\t\tTimeout:               20 * time.Second,\n\t\t}),\n\t}\n\n\ts := grpc.NewServer(opts...)\n\t// Register services...\n\tif err := s.Serve(lis); err != nil {\n\t\tpanic(err)\n\t}\n}",
    "verification": "Enable verbose HTTP/2 diagnostic logging on your gRPC application using `export GODEBUG=http2debug=2` and observe the trace logs under high load. Check that `WINDOW_UPDATE` frames are sent back and forth dynamically, and confirm that stream windows never flatline to zero.",
    "date": "2026-06-04",
    "id": 1780573635,
    "type": "error"
});