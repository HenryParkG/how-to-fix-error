window.onPostDataLoaded({
    "title": "Mitigating gRPC Flow Control Deadlocks in Microservices",
    "slug": "grpc-flow-control-deadlocks",
    "language": "Go",
    "code": "ResourceExhausted",
    "tags": [
        "Go",
        "Infra",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>gRPC utilizes HTTP/2 flow control windows at both the stream and connection levels. In nested microservice calls (A -> B -> C), a deadlock can occur if Service A stops reading from B's response stream while Service C is still pushing data to B.</p><p>If B's internal buffer fills up while it's waiting for A to acknowledge receipt, B's outbound flow control window hits zero. If B is also synchronously waiting for C, the entire chain stalls because no party can release tokens to move the data forward.</p>",
    "root_cause": "Circular dependency on HTTP/2 flow control window updates across multiple hop synchronous calls.",
    "bad_code": "// Synchronous proxy without buffering or timeouts\nfunc (s *ServiceB) Fetch(ctx context.Context, req *Req) (*Res, error) {\n    // If stream to A is blocked, this blocks B indefinitely\n    return s.ClientC.GetData(ctx, req)\n}",
    "solution_desc": "Increase the initial window size for high-throughput services and implement aggressive request timeouts. Use asynchronous processing or local buffering to decouple the upstream receive window from the downstream send window.",
    "good_code": "import \"google.golang.org/grpc\"\n\n// Increase flow control windows to prevent early stalls\nvar opts = []grpc.ServerOption{\n    grpc.InitialWindowSize(1 << 20),     // 1MB\n    grpc.InitialConnWindowSize(1 << 20), // 1MB\n}\ns := grpc.NewServer(opts...)",
    "verification": "Check gRPC 'go_grpc_server_handled_total' metrics. If 'ResourceExhausted' codes spike alongside latency, window exhaustion is the culprit.",
    "date": "2026-04-08",
    "id": 1775642462,
    "type": "error"
});