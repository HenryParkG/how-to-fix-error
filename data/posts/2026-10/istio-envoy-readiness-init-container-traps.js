window.onPostDataLoaded({
    "title": "Fix Istio Envoy Readiness & Init Container Traps",
    "slug": "istio-envoy-readiness-init-container-traps",
    "language": "Kubernetes",
    "code": "CrashLoopBackOff",
    "tags": [
        "Kubernetes",
        "Docker",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio-enabled Kubernetes cluster, the automatic sidecar injector injects the <code>istio-init</code> and <code>istio-proxy</code> containers into the target application Pod. A prevalent issue arises when secondary custom init containers or application containers make outbound network requests immediately upon startup.</p><p>Because <code>istio-init</code> establishes <code>iptables</code> port redirection before application containers initialize, outbound network traffic is forwarded to Envoy. If Envoy (<code>istio-proxy</code>) has not finished loading clusters and route tables from Istiod, early outgoing traffic fails with immediate connection drops or timeouts. Furthermore, improper readiness probes can mark pods unhealthy prematurely.</p>",
    "root_cause": "Application containers or init containers start routing traffic through Envoy before the proxy's listener tables and readiness endpoints are active, or iptables intercept outbound calls that init containers require.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  template:\n    metadata:\n      labels:\n        app: payment-service\n    spec:\n      initContainers:\n      - name: fetch-config\n        image: curlimages/curl\n        # BUG: Fails if iptables redirects traffic before external vault is accessible\n        command: ['curl', 'https://vault.external.internal/config']\n      containers:\n      - name: payment\n        image: payment:v1\n        ports:\n        - containerPort: 8080\n        # Application starts immediately and fails external API calls before Envoy is ready",
    "solution_desc": "Configure the Pod annotation `holdApplicationUntilProxyStarts: \"true\"` to instruct Kubernetes to pause application container startup until Envoy's readiness probe passes. Use `traffic.sidecar.istio.io/excludeOutboundPorts` or `excludeOutboundIPRanges` to allow init containers or direct system calls to bypass Envoy interception.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  template:\n    metadata:\n      labels:\n        app: payment-service\n      annotations:\n        # Ensure Envoy proxy is fully initialized before application containers boot\n        proxy.istio.io/config: '{\"holdApplicationUntilProxyStarts\": true}'\n        # Exclude internal configuration service port from iptables capture\n        traffic.sidecar.istio.io/excludeOutboundPorts: \"8200\"\n    spec:\n      initContainers:\n      - name: fetch-config\n        image: curlimages/curl\n        command: ['curl', 'http://vault.external.internal:8200/config']\n      containers:\n      - name: payment\n        image: payment:v1\n        ports:\n        - containerPort: 8080\n        readinessProbe:\n          httpGet:\n            path: /healthz\n            port: 8080\n          initialDelaySeconds: 5",
    "verification": "Inspect container startup order using `kubectl describe pod <pod-name>` to verify that `istio-proxy` transitions to Running and reports healthy (`curl localhost:15021/healthz/ready`) before the main application container starts.",
    "date": "2026-10-11",
    "id": 1791712091,
    "type": "error"
});