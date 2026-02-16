window.onPostDataLoaded({
    "title": "Fixing Istio 503 Downstream Connection Resets",
    "slug": "istio-503-downstream-resets",
    "language": "Kubernetes",
    "code": "503 UC",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>In cross-region service meshes, 503 'UC' (Upstream Connection) errors or downstream resets often occur due to race conditions between Envoy's keep-alive timers and the application's idle timeouts. When a request travels across regions, latency increases the window where a downstream proxy sends a request on a connection that the upstream has already decided to close, resulting in a reset before the response headers are sent.</p>",
    "root_cause": "Mismatch between the application's Keep-Alive timeout and Envoy's 'connection_idle_timeout'. If the application closes the connection first without Envoy knowing, Envoy fails the request.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nspec:\n  host: my-service\n  # Missing connectionPool settings results in default idle timeouts",
    "solution_desc": "Configure the DestinationRule to ensure Envoy's idle timeout is shorter than the application's timeout, and implement retry logic for connection resets in the VirtualService.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nspec:\n  host: my-service\n  trafficPolicy:\n    connectionPool:\n      http:\n        idleTimeout: 30s\n        maxRetries: 3\n---\n# VirtualService Retry\nretryOn: \"reset,connect-failure,refused-stream\"",
    "verification": "Check Envoy logs for 'response_flags: UC' and verify the 'upstream_cx_destroy_remote_with_active_rq' metric.",
    "date": "2026-02-16",
    "id": 1771217706,
    "type": "error"
});