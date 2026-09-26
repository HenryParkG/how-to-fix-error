window.onPostDataLoaded({
    "title": "Fix Envoy Sidecar Lifecycle Races & Egress Resets",
    "slug": "istio-envoy-sidecar-lifecycle-race-egress-reset",
    "language": "Go",
    "code": "ECONNRESET",
    "tags": [
        "Kubernetes",
        "Go",
        "Docker",
        "Istio",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes clusters running Istio service meshes, application containers often start before the <code>envoy-proxy</code> sidecar is fully initialized, or terminate after Envoy has already severed egress connectivity during shutdown sequences. When a pod starts, <code>iptables</code> rules installed by <code>istio-init</code> intercept all inbound and outbound traffic, redirecting it to Envoy localhost port 15001/15006.</p><p>If the main workload attempts external API calls or database connections before Envoy is ready (listening on port 15021), network calls fail with <code>ECONNREFUSED</code>. Conversely, during Pod eviction or graceful shutdown, Kubernetes simultaneously delivers <code>SIGTERM</code> to both containers. Envoy begins draining listeners immediately, terminating active outbound TCP sessions with <code>ECONNRESET</code> while the application container is still attempting to flush final telemetry or state transactions.</p>",
    "root_cause": "Lack of container lifecycle synchronization between application workloads and the Envoy sidecar. `iptables` redirects traffic immediately upon pod creation, but Envoy is not ready; during pod teardown, Envoy drains connections before the application container finishes egress operations.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-processor\nspec:\n  template:\n    spec:\n      containers:\n      - name: payment-svc\n        image: payment-svc:v1\n        command: [\"/app/run\"]\n        # Container starts immediately; attempts egress calls before envoy is listening\n        # During shutdown, Envoy terminates immediately while payment-svc flushes txns",
    "solution_desc": "Enable Istio's native container ordering (`holdApplicationUntilProxyStarts`) to ensure Envoy is healthy prior to application bootstrap. For teardown races, configure a `preStop` hook on the Envoy sidecar or application pod along with lifecycle termination drain parameters to ensure the application shuts down before Envoy stops routing egress traffic.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-processor\nspec:\n  template:\n    metadata:\n      annotations:\n        # Ensure Istio injects proxy before app and holds app startup\n        proxy.istio.io/config: |\n          holdApplicationUntilProxyStarts: true\n    spec:\n      containers:\n      - name: payment-svc\n        image: payment-svc:v1\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/bin/sh\", \"-c\", \"sleep 5\"]\n      - name: istio-proxy\n        image: auto\n        lifecycle:\n          preStop:\n            exec:\n              command: [\"/usr/local/bin/pilot-agent\", \"wait-drain\", \"--drain-duration\", \"15s\"]",
    "verification": "Deploy high-frequency egress workloads and run `kubectl rollout restart deployment payment-processor`. Inspect logs and verify 0 occurrences of `503 UC` upstream connect failures or socket resets in both application and envoy-access logs.",
    "date": "2026-09-26",
    "id": 1790390169,
    "type": "error"
});