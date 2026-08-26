window.onPostDataLoaded({
    "title": "Fixing Istio Sidecar Injection & Envoy Intercept Glitches",
    "slug": "istio-sidecar-injection-traffic-interception-fix",
    "language": "Istio / Kubernetes",
    "code": "EnvoyInjectionFailure",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Istio utilizes a Kubernetes MutatingAdmissionWebhook (<code>istio-sidecar-injector</code>) to automatically inject the <code>istio-proxy</code> Envoy container and <code>istio-init</code> iptables setup container into newly created Pods. Failures typically manifest in two ways: the sidecar is never injected, or iptables traffic interception routes outbound/inbound traffic into an infinite loop or breaks health probe communication (Kubelet <code>livenessProbe</code>/<code>readinessProbe</code> failures).</p><p>When namespaces lack proper labels, when pods specify host networking (<code>hostNetwork: true</code>), or when iptables fails to exclude health check ports, pods fail to start or report continuous connection timeouts.</p>",
    "root_cause": "The target namespace lacks the `istio-injection=enabled` label (or matches an exclusion rule), and Envoy's iptables interception intercepts Kubelet health probe ports that are not rewritten by Istio sidecar injection.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\n  namespace: default\nspec:\n  replicas: 2\n  template:\n    metadata:\n      labels:\n        app: payment\n    spec:\n      # hostNetwork bypasses Istio sidecar proxy completely\n      hostNetwork: true\n      containers:\n      - name: payment\n        image: payment-service:1.0\n        ports:\n        - containerPort: 8080\n        livenessProbe:\n          httpGet:\n            path: /healthz\n            port: 8080",
    "solution_desc": "Enable sidecar injection on the namespace, remove hostNetwork inheritance, and ensure Istio's probe rewrite mechanism is active by adding appropriate annotations or configuring traffic exclusions.",
    "good_code": "# 1. Enable injection at namespace level\n# kubectl label namespace production istio-injection=enabled --overwrite\n\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\n  namespace: production\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: payment\n  template:\n    metadata:\n      labels:\n        app: payment\n      annotations:\n        # Ensure health checks are handled properly\n        sidecar.istio.io/rewriteAppHTTPProbers: \"true\"\n        sidecar.istio.io/inject: \"true\"\n    spec:\n      hostNetwork: false\n      containers:\n      - name: payment\n        image: payment-service:1.0\n        ports:\n        - name: http\n          containerPort: 8080\n        livenessProbe:\n          httpGet:\n            path: /healthz\n            port: 8080\n          initialDelaySeconds: 5\n          periodSeconds: 10",
    "verification": "Run `istioctl analyze -n production` to detect configuration conflicts, followed by `kubectl get pods -n production -l app=payment -o jsonpath='{.items[*].spec.containers[*].name}'` to confirm `istio-proxy` is running alongside the app container.",
    "date": "2026-08-26",
    "id": 1787715926,
    "type": "error"
});