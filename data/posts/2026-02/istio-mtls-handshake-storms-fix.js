window.onPostDataLoaded({
    "title": "Mitigating Istio mTLS Handshake Storms",
    "slug": "istio-mtls-handshake-storms-fix",
    "language": "Istio, Envoy",
    "code": "TLS_HANDSHAKE_TIMEOUT",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>During rapid HPA (Horizontal Pod Autoscaler) events, hundreds of new Envoy sidecars may attempt to initialize simultaneously. Each sidecar requests a certificate via the Secret Discovery Service (SDS) from Istiod. This 'thundering herd' effect causes Istiod's CPU to max out, leading to mTLS handshake timeouts and failed readiness probes across the mesh.</p>",
    "root_cause": "The Secret Discovery Service (SDS) becomes a bottleneck when processing a massive burst of CSR (Certificate Signing Request) requests during cluster scaling.",
    "bad_code": "apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  maxReplicas: 500\n  metrics:\n  - type: Resource\n    resource:\n      name: cpu\n      targetAverageUtilization: 50",
    "solution_desc": "Increase Istiod resources and implement pilot-discovery throttling. Use 'PILOT_THROTTLE_NAMESPACES' and 'PILOT_MAX_CERT_ISSUANCE_PER_SECOND' to rate-limit CSRs. Additionally, tune the HPA scale-up velocity to prevent overwhelming the control plane.",
    "good_code": "apiVersion: install.istio.io/v1alpha1\nkind: IstioOperator\nspec:\n  values:\n    pilot:\n      env:\n        PILOT_MAX_CERT_ISSUANCE_PER_SECOND: \"100\"",
    "verification": "Check Istiod logs for 'sds_registration_timeout' and monitor 'pilot_sds_certificate_issuances_total' metrics.",
    "date": "2026-02-27",
    "id": 1772166691,
    "type": "error"
});