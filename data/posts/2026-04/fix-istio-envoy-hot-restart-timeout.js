window.onPostDataLoaded({
    "title": "Fixing Istio Sidecar Timeouts during Envoy Hot Restarts",
    "slug": "fix-istio-envoy-hot-restart-timeout",
    "language": "Kubernetes",
    "code": "UpstreamTimeout",
    "tags": [
        "Kubernetes",
        "Istio",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>When Istio's Envoy proxy undergoes a hot restart or when a pod is terminating, existing connections are often severed prematurely. This occurs because the default 'drain duration' does not align with the Kubernetes termination grace period, leading to 503 errors as the proxy stops listening before the application has finished processing in-flight requests.</p>",
    "root_cause": "The default terminationDrainDuration in Istio is often too short, causing Envoy to shut down listeners while the application container is still active and expecting network ingress.",
    "bad_code": "apiVersion: install.istio.io/v1alpha1\nkind: IstioOperator\nspec:\n  meshConfig:\n    # Default values often miss explicit drain durations\n    terminationDrainDuration: 5s",
    "solution_desc": "Configure the terminationDrainDuration to allow Envoy to stay alive long enough for the application to finish its work and for the Kubernetes SDN to update its endpoint state, effectively silencing race-condition timeouts.",
    "good_code": "apiVersion: install.istio.io/v1alpha1\nkind: IstioOperator\nspec:\n  meshConfig:\n    # Increase duration to allow graceful connection termination\n    terminationDrainDuration: 30s\n    extensionProviders:\n    - name: \"envoy\"\n      envoyExtAuthzHttp:\n        service: \"authz-service.foo.svc.cluster.local\"",
    "verification": "Execute 'kubectl delete pod' while running a load test; monitor for non-200 responses. Success is zero 503 errors during pod rotation.",
    "date": "2026-04-13",
    "id": 1776066573,
    "type": "error"
});