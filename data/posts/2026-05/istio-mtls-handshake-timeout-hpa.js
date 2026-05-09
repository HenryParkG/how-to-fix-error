window.onPostDataLoaded({
    "title": "Fixing Istio mTLS Timeouts During Aggressive HPA",
    "slug": "istio-mtls-handshake-timeout-hpa",
    "language": "Go",
    "code": "TLS_HANDSHAKE_TIMEOUT",
    "tags": [
        "Kubernetes",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When services scale rapidly under extreme Horizontal Pod Autoscaling (HPA), new Envoy sidecars flood the Istio control plane (istiod) with CSR (Certificate Signing Request) demands. If the control plane or the local Envoy SDS (Secret Discovery Service) is CPU-throttled during initialization, the mTLS handshake between the new pod and existing pods fails. This leads to 503 errors and 'upstream connect error or disconnect/reset before headers' during the burst period.</p>",
    "root_cause": "Envoy sidecars start processing traffic before the identity certificates are fully rotated/provisioned via SDS, exacerbated by CPU CFS throttling on the sidecar container.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      annotations:\n        sidecar.istio.io/inject: \"true\"\n    spec:\n      containers:\n      - name: app\n        resources:\n          limits:\n            cpu: \"100m\" # Too low, causes SDS delay",
    "solution_desc": "Increase CPU requests for the sidecar to prevent throttling during the handshake phase and use 'holdApplicationUntilProxyReceivesConfig' to ensure the proxy is ready before the app starts.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  template:\n    metadata:\n      annotations:\n        proxy.istio.io/config: | \n          holdApplicationUntilProxyReceivesConfig: true\n        sidecar.istio.io/proxyCPU: \"500m\"\n        sidecar.istio.io/proxyCPULimit: \"1000m\"",
    "verification": "Check 'pilot_proxy_sds_failures_total' metrics and ensure 'istioctl proxy-status' shows SYNCED during scaling events.",
    "date": "2026-05-09",
    "id": 1778305224,
    "type": "error"
});