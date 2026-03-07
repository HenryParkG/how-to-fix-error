window.onPostDataLoaded({
    "title": "Resolving Istio mTLS Handshake Timeouts",
    "slug": "istio-mtls-handshake-timeout-fix",
    "language": "Kubernetes",
    "code": "mTLSHandshakeTimeout",
    "tags": [
        "Istio",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Microservices with high pod churn (rapid scaling or frequent deployments) often experience 503 errors and mTLS handshake timeouts. This happens because the Envoy sidecar cannot obtain new certificates from the Istiod CA fast enough, or the existing Secret Discovery Service (SDS) connection remains stale after a pod IP change.</p>",
    "root_cause": "The default Citadel/Istiod certificate rotation grace period is too short, and the Secret Discovery Service (SDS) 'push' mechanism becomes a bottleneck during burst scaling events.",
    "bad_code": "apiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nspec:\n  mtls:\n    mode: STRICT\n# Lacks configuration for SDS retry and grace periods",
    "solution_desc": "Optimize the ProxyConfig to increase the `proxyMetadata` for SDS connection timeouts and tune the Istiod environment variables to handle more concurrent CSR (Certificate Signing Request) signatures.",
    "good_code": "meshConfig:\n  defaultConfig:\n    proxyMetadata:\n      SECRET_TTL: \"24h\"\n      SECRET_GRACE_PERIOD_RATIO: \"0.5\"\n      ISTIO_META_IDLE_TIMEOUT: \"30s\"",
    "verification": "Check the Envoy logs for `upstream connect error or disconnect/reset before headers`. If the logs show successful mTLS handshakes during a scale-up event, the timeout issue is resolved.",
    "date": "2026-03-07",
    "id": 1772875276,
    "type": "error"
});