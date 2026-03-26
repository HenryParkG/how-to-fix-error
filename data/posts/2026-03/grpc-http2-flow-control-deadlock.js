window.onPostDataLoaded({
    "title": "Debugging gRPC HTTP/2 Stream Flow Control Deadlocks",
    "slug": "grpc-http2-flow-control-deadlock",
    "language": "Go",
    "code": "Stream Stalls",
    "tags": [
        "Go",
        "gRPC",
        "Backend",
        "Error Fix"
    ],
    "analysis": "<p>In high-throughput gRPC environments, services occasionally experience 'stuck' requests where the client and server stop communicating without an error. This is often a flow control deadlock at the HTTP/2 layer. Unlike TCP flow control, HTTP/2 implements its own window-based flow control for individual streams and the entire connection. If a consumer is slow to read from a stream, the window size drops to zero, pausing the producer. If the producer is also waiting on the consumer for a different resource, a deadlock occurs.</p>",
    "root_cause": "The server or client reaches the InitialWindowSize limit, and because the application layer isn't consuming the messages (e.g., blocked on a channel or mutex), no WINDOW_UPDATE frames are sent, permanently stalling the stream.",
    "bad_code": "s := grpc.NewServer()\n// Using default flow control window (64KB)\n// This can easily stall on high-latency links or large payloads\npb.RegisterMyServiceServer(s, &server{})",
    "solution_desc": "Increase the initial window size for both the connection and the stream. This allows more data to be 'in flight' before an ACK/Window Update is required. Additionally, ensure that the application consumer loop is never blocked by external logic while reading from the stream.",
    "good_code": "s := grpc.NewServer(\n    grpc.InitialWindowSize(1 << 20), // 1MB\n    grpc.InitialConnWindowSize(1 << 20),\n    grpc.MaxConcurrentStreams(100),\n)\npb.RegisterMyServiceServer(s, &server{})",
    "verification": "Enable gRPC debug logging via 'GRPC_GO_LOG_SEVERITY_LEVEL=info' and monitor for 'WINDOW_UPDATE' frames. Use 'strace' or 'tcpdump' to verify that bytes are moving on the wire after the window is adjusted.",
    "date": "2026-03-26",
    "id": 1774508298,
    "type": "error"
});