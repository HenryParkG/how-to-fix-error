window.onPostDataLoaded({
    "title": "Fixing Envoy Sidecar Connection Pooling Starvation",
    "slug": "istio-envoy-mtls-starvation-fix",
    "language": "Envoy / Istio",
    "code": "PoolStarvation",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In high-traffic Istio service meshes, mTLS handshakes introduce significant latency during the initial connection phase. Envoy's default connection pooling settings are often too conservative for services experiencing rapid spikes. When 'http1MaxPendingRequests' or 'maxConnections' thresholds are reached, Envoy begins rejecting traffic or queuing it until timeouts occur.</p><p>This 'starvation' is exacerbated under mTLS because the handshake requires multiple round-trips and CPU-intensive cryptographic operations. If the pool is full of connections waiting for handshakes to complete, new requests are dropped immediately, leading to 503 errors despite the backend having capacity.</p>",
    "root_cause": "Inadequate traffic policy configuration in DestinationRules failing to account for the handshake latency overhead of mTLS.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-svc\nspec:\n  host: backend-svc.prod.svc.cluster.local\n  # Missing connectionPool settings - defaults to very low limits",
    "solution_desc": "Explicitly define a DestinationRule with an optimized trafficPolicy. Increase 'http2MaxRequests' and 'maxConnections'. Specifically, tune 'http1MaxPendingRequests' to allow a larger buffer for connections undergoing mTLS negotiation.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: backend-svc\nspec:\n  host: backend-svc.prod.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n        connectTimeout: 10s\n      http:\n        http2MaxRequests: 1024\n        maxRequestsPerConnection: 10\n        http1MaxPendingRequests: 1024",
    "verification": "Use 'istioctl proxy-config endpoint' to verify the settings and run a load test to observe the 'upstream_rq_pending_overflow' counter in Envoy metrics.",
    "date": "2026-04-25",
    "id": 1777093579,
    "type": "error"
});