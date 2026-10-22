window.onPostDataLoaded({
    "title": "Fix Istio 503 UC Connection Resets on Idle Timeouts",
    "slug": "fix-istio-503-uc-tcp-keepalive-idle-timeout-mismatch",
    "language": "Kubernetes",
    "code": "503 UC upstream_reset_before_response_started",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio service mesh, upstream connection termination errors (logged as <code>503 UC</code> with <code>upstream_reset_before_response_started{connection_termination}</code>) occur when the downstream Envoy proxy selects a pre-existing pooled TCP connection that has already been closed by the upstream application or an intermediate stateful firewall.</p><p>By default, Envoy maintains upstream persistent HTTP keepalive pools. If the upstream service or intermediate cloud NAT/load balancer silently closes an idle connection sooner than Envoy expects\u2014or tears down the socket via TCP RST without Envoy noticing\u2014Envoy dispatches an in-flight request onto the dead socket. When Envoy receives the RST or zero-byte EOF, it terminates the transaction with a <code>503 UC</code> response flag.</p>",
    "root_cause": "The upstream application or middlebox idle timeout is shorter than Envoy's upstream connection idle timeout, causing the upstream to terminate idle connections while Envoy still considers them active in its HTTP connection pool.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-service\nspec:\n  host: backend-service.default.svc.cluster.local\n  # Missing connectionPool timeouts; Envoy defaults allow connection reuse\n  # while upstream server (e.g., Node.js / Go) drops idle conns after 5s\n  trafficPolicy:\n    tls:\n      mode: ISTIO_MUTUAL",
    "solution_desc": "Configure the DestinationRule connection pool so that Envoy's upstream idle timeout is explicitly shorter than the upstream server's keepalive timeout. Additionally, enable TCP keepalives with low probe intervals to keep stateful intermediate NAT tables alive and detect dead peers proactively.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-service\nspec:\n  host: backend-service.default.svc.cluster.local\n  trafficPolicy:\n    tls:\n      mode: ISTIO_MUTUAL\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n        tcpKeepalive:\n          time: 30s\n          interval: 5s\n          probes: 3\n      http:\n        # Must be strictly lower than upstream HTTP server keepalive timeout\n        idleTimeout: 4s\n        maxRequestsPerConnection: 100",
    "verification": "Check Envoy access logs via `kubectl logs <pod-name> -c istio-proxy` to confirm the elimination of `503 UC` flags. Query Prometheus metric `sum(rate(istio_requests_total{response_flags=\"UC\"}[5m]))` to verify error rates drop to zero.",
    "date": "2026-10-22",
    "id": 1792678470,
    "type": "error"
});