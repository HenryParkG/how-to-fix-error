window.onPostDataLoaded({
    "title": "Istio mTLS Handshake Timeouts in High-Churn Clusters",
    "slug": "istio-mtls-handshake-timeout",
    "language": "Go/Envoy",
    "code": "mTLSTimeout",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In high-churn Kubernetes environments where pods are frequently created and destroyed, the Istiod control plane may lag in propagating the correct Mutual TLS (mTLS) certificates and Endpoint Discovery Service (EDS) updates to the Envoy sidecars. This results in '503 Service Unavailable' or handshake timeouts because the destination proxy rejects connections based on stale identity data.</p><p>The issue is exacerbated when the application code attempts to send traffic before the Envoy sidecar has fully initialized its identity context from the Citadel/Pilot agents.</p>",
    "root_cause": "Race conditions between application startup and Envoy sidecar certificate readiness (SVID synchronization).",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: PeerAuthentication\nmetadata:\n  name: default\nspec:\n  mtls:\n    mode: STRICT",
    "solution_desc": "Configure 'holdApplicationUntilProxyReady' to ensure the network stack is valid before the app starts, and tune the proxy initialization parameters.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  annotations:\n    proxy.istio.io/config: '{ \"holdApplicationUntilProxyReady\": true }'\nspec:\n  containers:\n  - name: app",
    "verification": "Check Envoy logs for 'protocol error: TLS_error' and verify that app logs show no network attempts until after the Envoy 'ready' state.",
    "date": "2026-02-24",
    "id": 1771926213,
    "type": "error"
});