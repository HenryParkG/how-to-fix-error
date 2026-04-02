window.onPostDataLoaded({
    "title": "Fixing gRPC Deadline Cascades in Istio Meshes",
    "slug": "grpc-deadline-cascades-istio",
    "language": "Go",
    "code": "DEADLINE_EXCEEDED",
    "tags": [
        "Go",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In complex microservice architectures managed by Istio, a slow downstream service can trigger a 'deadline exceeded' cascade. Without proper propagation, upstream services continue processing requests that have already timed out from the perspective of the initial caller, wasting CPU and memory resources across the entire mesh.</p>",
    "root_cause": "Timeout values are often hardcoded at each hop rather than being derived from the remaining time available in the original request's context, leading to 'phantom' processing.",
    "bad_code": "func (s *server) CallDownstream(ctx context.Context) {\n    // Bad: Creating a new context with a fixed timeout\n    childCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)\n    defer cancel()\n    resp, err := s.client.GetData(childCtx, &req)\n}",
    "solution_desc": "Propagate the existing context deadline and configure Istio's VirtualService to respect the 'grpc-timeout' header, ensuring that if a caller times out, all downstream sidecars immediately terminate the request chain.",
    "good_code": "func (s *server) CallDownstream(ctx context.Context) {\n    // Good: Pass the existing ctx directly to propagate the deadline\n    // Ensure Istio outbound traffic policy is set to ALLOW_ANY or REGISTRY_ONLY\n    resp, err := s.client.GetData(ctx, &req)\n    if err != nil && status.Code(err) == codes.DeadlineExceeded {\n        log.Printf(\"Request timed out upstream\")\n    }\n}",
    "verification": "Inject a 10s delay in the leaf service. Verify that the intermediate services return 408/504 immediately when the edge gateway's 2s timeout is hit.",
    "date": "2026-04-02",
    "id": 1775113317,
    "type": "error"
});