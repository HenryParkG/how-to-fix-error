window.onPostDataLoaded({
    "title": "Resolving Envoy Connection Exhaustion & UC 503 Cascades",
    "slug": "resolving-envoy-connection-exhaustion-uc-503-cascades",
    "language": "Kubernetes",
    "code": "Envoy503UC",
    "tags": [
        "Kubernetes",
        "Docker",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>In Istio service meshes, high-throughput microservices can suffer from sudden cascading 503 errors accompanied by the <code>UC</code> (Upstream Connection Termination / Reset) response flag. Envoy sidecars log <code>upstream_reset_before_response_started{connection_termination}</code> or circuit breaker overflows.</p><p>This cascade is typically initiated by mismatched HTTP/2 connection pooling parameters between Envoy and the upstream application. When <code>maxConnections</code>, <code>maxRequestsPerConnection</code>, or idle timeout thresholds are misaligned, upstream pods terminate idle or overloaded connections abruptly, causing Envoy to return 503 UC to clients instead of retrying seamlessly.</p>",
    "root_cause": "TCP/HTTP connection pooling limits in Istio DestinationRule are exhausted, causing Envoy circuit breakers to trip or upstream keepalive timeouts to sever connections mid-request without retry policies.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: payment-service-dr\nspec:\n  host: payment-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 10\n      http:\n        http1MaxPendingRequests: 1\n        maxRequestsPerConnection: 1\n    outlierDetection:\n      consecutive5xxErrors: 1\n      interval: 1s\n      baseEjectionTime: 3m",
    "solution_desc": "Configure realistic connection pooling limits matching backend thread capability, align idle keepalive timeouts so Envoy terminates stale connections before upstream does, and add idempotent retry policies for 'connect-failure' and 'refused-stream' in the VirtualService.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: payment-service-dr\nspec:\n  host: payment-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 2048\n        tcpKeepalive:\n          time: 300s\n          interval: 15s\n      http:\n        http1MaxPendingRequests: 1024\n        maxRequestsPerConnection: 100\n        idleTimeout: 60s\n---\napiVersion: networking.istio.io/v1alpha3\nkind: VirtualService\nmetadata:\n  name: payment-service-vs\nspec:\n  hosts:\n  - payment-service.prod.svc.cluster.local\n  http:\n  - route:\n    - destination:\n        host: payment-service.prod.svc.cluster.local\n    retries:\n      attempts: 3\n      perTryTimeout: 2s\n      retryOn: connect-failure,refused-stream,503",
    "verification": "Monitor `istioctl dashboard prometheus` metrics: `istio_requests_total{response_code=\"503\", response_flags=\"UC\"}` should drop to zero under sustained load using `k6` or `fortio`.",
    "date": "2026-10-18",
    "id": 1792289496,
    "type": "error"
});