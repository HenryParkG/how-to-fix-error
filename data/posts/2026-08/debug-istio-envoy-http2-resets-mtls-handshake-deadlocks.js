window.onPostDataLoaded({
    "title": "Debug Istio Envoy HTTP/2 Resets & mTLS Handshake",
    "slug": "debug-istio-envoy-http2-resets-mtls-handshake-deadlocks",
    "language": "Go",
    "code": "ENVOY_RESET_503",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Istio",
        "Networking",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio service mesh, intermittent <code>503 UC (Upstream Connection Termination)</code> or <code>HTTP/2 stream reset with error code: PROTOCOL_ERROR / REFUSED_STREAM</code> errors often occur due to mismatched connection pool settings, misaligned mTLS STRICT mode configurations, or race conditions during Citadel certificate rotation.</p><p>When an ingress sidecar proxies HTTP/2 connections with keepalive timeouts longer than the downstream idle timeout, stale socket re-use causes immediate RST_STREAM responses. Furthermore, conflicting DestinationRules without explicit mTLS transport socket definitions cause raw TCP requests to hit encrypted listener filters, triggering handshake deadlocks.</p>",
    "root_cause": "Misconfigured DestinationRule TLS mode conflicting with PeerAuthentication STRICT enforcement, paired with unaligned Envoy HTTP/2 stream concurrency limits and idle TCP connection timeouts.",
    "bad_code": "apiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nmetadata:\n  name: default\n  namespace: backend\nspec:\n  mtls:\n    mode: STRICT\n---\napiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-dr\n  namespace: backend\nspec:\n  host: backend.backend.svc.cluster.local\n  trafficPolicy:\n    tls:\n      mode: DISABLE # Bug: Breaks STRICT mTLS -> Causes connection termination",
    "solution_desc": "Align DestinationRule TLS mode with `ISTIO_MUTUAL` and tune HTTP/2 connection pooling parameters, max requests per connection, and circuit-breaker max stream limits within Envoy's traffic policy.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-dr\n  namespace: backend\nspec:\n  host: backend.backend.svc.cluster.local\n  trafficPolicy:\n    tls:\n      mode: ISTIO_MUTUAL # Matches PeerAuthentication STRICT\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n        connectTimeout: 30ms\n        tcpKeepalive:\n          time: 300s\n          interval: 60s\n      http:\n        http2MaxRequests: 1000\n        maxRequestsPerConnection: 100\n        idleTimeout: 120s",
    "verification": "Check Envoy access logs via `kubectl logs <pod-name> -c istio-proxy` to confirm absence of `UC` or `URX` flags. Verify endpoint health with `istioctl proxy-config endpoints <pod-name>` and `istioctl authn tls-check <pod-name>`.",
    "date": "2026-08-23",
    "id": 1787456529,
    "type": "error"
});