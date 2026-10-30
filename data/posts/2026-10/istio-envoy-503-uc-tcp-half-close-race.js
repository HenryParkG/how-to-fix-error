window.onPostDataLoaded({
    "title": "Fixing Istio Envoy 503 UC Flaky Connection Resets",
    "slug": "istio-envoy-503-uc-tcp-half-close-race",
    "language": "Go",
    "code": "503 UC (upstream_connection_termination)",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio service mesh, workloads occasionally face intermittent <code>503 UC</code> (Upstream Connection termination) errors. These errors arise during high-concurrency HTTP/1.1 reuse cycles due to a TCP half-close race condition.</p><p>When an upstream service's keepalive idle timeout is lower than or closely matched with the downstream Envoy sidecar's idle timeout, the upstream application initiates a <code>FIN</code> packet to close an idle connection at the exact moment Envoy forwards an incoming request. Envoy transmits the request frames into a closing TCP socket, causing the upstream kernel to respond with a <code>RST</code> packet. Envoy records this as <code>UC</code> and yields a synthetic 503 to the caller.</p>",
    "root_cause": "The upstream application idle timeout was shorter than Envoy's upstream connection idle timeout. Additionally, TCP keepalive probes and retry policies for connection-level reset errors were absent in DestinationRule.",
    "bad_code": "apiVersion: networking.istio.io/v1beta1\nkind: DestinationRule\nmetadata:\n  name: upstream-service\nspec:\n  host: upstream-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n      # Missing idleTimeout configuration: defaults allow race against upstream",
    "solution_desc": "Configure the upstream application's idle timeout higher than Envoy's client connection timeout, and strictly limit the upstream idle pool timeout in Envoy's `DestinationRule` so Envoy retires connections before the upstream drops them. Apply an Istio `VirtualService` retry policy on `reset` and `connect-failure` to ensure safe, idempotent requests are automatically retried.",
    "good_code": "apiVersion: networking.istio.io/v1beta1\nkind: DestinationRule\nmetadata:\n  name: upstream-service\nspec:\n  host: upstream-service.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n        tcpKeepalive:\n          time: 30s\n          interval: 5s\n      http:\n        idleTimeout: 45s\n        maxRequestsPerConnection: 100\n---\napiVersion: networking.istio.io/v1beta1\nkind: VirtualService\nmetadata:\n  name: upstream-service\nspec:\n  hosts:\n  - upstream-service.prod.svc.cluster.local\n  http:\n  - route:\n    - destination:\n        host: upstream-service.prod.svc.cluster.local\n    retries:\n      attempts: 3\n      perTryTimeout: 2s\n      retryOn: \"connect-failure,refused-stream,reset\"",
    "verification": "Monitor Envoy logs using `istioctl proxy-logs <pod-name>` filtered for `response_flags=\"UC\"`. Verify Prometheus metrics show zero `envoy_cluster_upstream_cx_destroy_with_active_rq` increments during rolling restarts.",
    "date": "2026-10-30",
    "id": 1793361402,
    "type": "error"
});