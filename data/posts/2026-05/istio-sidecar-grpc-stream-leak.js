window.onPostDataLoaded({
    "title": "Fix Istio Sidecar Memory Exhaustion from gRPC Stream Leaks",
    "slug": "istio-sidecar-grpc-stream-leak",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "gRPC",
        "Istio",
        "Error Fix"
    ],
    "analysis": "<p>When deploying microservices within an Istio service mesh, the Envoy sidecar (istio-proxy) intercepts all inbound and outbound traffic. If an application makes frequent, ephemeral gRPC streams (such as server-streaming telemetry or bidirectional status calls) but fails to gracefully close them, a critical leak occurs inside Envoy's tracking state. For every gRPC stream, Envoy allocates memory buffers, HTTP/2 downstream/upstream connection metadata, and filter chain contexts. If the client or server simply abandons the stream without sending half-close or cancellation frames, the connection remains active in Envoy's active connection table. Over time, these dangling connections trigger memory exhaustion, leading to Envoy being terminated with an Out Of Memory (OOMKilled) error.</p>",
    "root_cause": "The root cause is unclosed HTTP/2 stream state blocks in Envoy due to application-level gRPC streams that are terminated by local context cancellation or network failure without calling stream.CloseSend() or explicitly canceling the context, causing the sidecar proxy to retain the stream context indefinitely.",
    "bad_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n\t\"log\"\n\t\"pb/telemetry\"\n)\n\nfunc LeakGrpcStreams(client telemetry.TelemetryServiceClient) {\n\tfor {\n\t\t// Leaky implementation: Context is never cancelled, and stream is abandoned\n\t\tstream, err := client.StreamMetrics(context.Background(), &telemetry.MetricsRequest{})\n\t\tif err != nil {\n\t\t\tlog.Printf(\"Error streaming: %v\", err)\n\t\t\tcontinue\n\t\t}\n\n\t\t_, err = stream.Recv()\n\t\tif err != nil {\n\t\t\t// Abandoning the stream without clean close\n\t\t\treturn \n\t\t}\n\t\t// Forgot to call stream.CloseSend() or cancel parent context\n\t}\n}",
    "solution_desc": "The application must strictly govern stream lifetimes using Go's context cancellation patterns, ensuring that every stream closure is propagated immediately to Envoy. Additionally, we must configure Envoy's idle timeouts via Istio EnvoyFilters or DestinationRules to automatically prune abandoned, dead-weight streams.",
    "good_code": "package main\n\nimport (\n\t\"context\"\n\t\"google.golang.org/grpc\"\n\t\"log\"\n\t\"time\"\n\t\"pb/telemetry\"\n)\n\nfunc SafeGrpcStreams(client telemetry.TelemetryServiceClient) {\n\tfor {\n\t\t// Create a context with a strict timeout to ensure cleanup\n\t\tctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)\n\t\t\n\t\tstream, err := client.StreamMetrics(ctx, &telemetry.MetricsRequest{})\n\t\tif err != nil {\n\t\t\tlog.Printf(\"Error streaming: %v\", err)\n\t\t\tcancel()\n\t\t\tcontinue\n\t\t}\n\n\t\t_, err = stream.Recv()\n\t\tif err != nil {\n\t\t\tlog.Printf(\"Stream aborted: %v\", err)\n\t\t\t_ = stream.CloseSend() // Send EOF to sidecar\n\t\t\tcancel()              // Clear resources immediately\n\t\t\treturn\n\t\t}\n\n\t\t// Defer cleanup blocks to prevent memory leaks under all exit paths\n\t\t_ = stream.CloseSend()\n\t\tcancel()\n\t}\n}",
    "verification": "Deploy the fixed application to the Kubernetes cluster. Track Envoy sidecar memory usage using Prometheus: `container_memory_working_set_bytes{container=\"istio-proxy\"}`. Run a continuous benchmark script spawning 50,000 parallel ephemeral connections; verify that memory curves reach a stable ceiling rather than climbing exponentially.",
    "date": "2026-05-24",
    "id": 1779588962,
    "type": "error"
});