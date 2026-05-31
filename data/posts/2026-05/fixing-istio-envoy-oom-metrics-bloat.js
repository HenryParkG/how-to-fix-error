window.onPostDataLoaded({
    "title": "Fixing Istio Envoy Sidecar OOMs from Metrics Bloat",
    "slug": "fixing-istio-envoy-oom-metrics-bloat",
    "language": "YAML / Kubernetes",
    "code": "OOMKilled",
    "tags": [
        "Kubernetes",
        "Docker",
        "Istio",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In an Istio-managed Kubernetes service mesh, the Envoy sidecar proxy is injected into target application pods to intercept and route network traffic. By default, Envoy is configured to record telemetry metrics for all incoming and outgoing connections, capturing features such as request paths, user-agents, and status codes. These metrics are stored in Envoy's local memory before they are scraped by monitoring tools like Prometheus.</p><p>When services handle public traffic containing high-cardinality attributes\u2014such as raw REST endpoints with dynamic IDs (e.g., <code>/api/v1/users/928372</code>) or variable request headers\u2014each unique combination is treated as a separate metric timeseries. Because Envoy records each key-value pair as a new entry, its metrics memory footprint grows indefinitely. Under sustained traffic, this high-cardinality bloat exhausts the sidecar proxy container's allocated memory limits, resulting in a Kubernetes <code>OOMKilled</code> status (Exit Code 137) and interrupting system traffic.</p>",
    "root_cause": "High-cardinality metric labels (e.g. raw, un-templated HTTP request paths) generate millions of unique metric timeseries dimensions in Envoy's memory cache, causing linear memory consumption that breaches the container's Kubernetes resource limits.",
    "bad_code": "apiVersion: telemetry.istio.io/v1alpha1\nkind: Telemetry\nmetadata:\n  name: default-telemetry\n  namespace: istio-system\nspec:\n  metrics:\n    - providers:\n        - name: prometheus\n      # Under this default/empty configuration, Istio records high-cardinality metadata\n      # including un-normalized request paths and parameters, crashing busy gateways.",
    "solution_desc": "The correct architectural remedy is to configure Envoy to normalize URI paths and remove dynamic IDs from metric dimensions. We apply an Istio Telemetry resource to customize metric generation. By using standard attribute definitions, we can configure dynamic path classification using Istio's regex-based path mapping or disable the collection of extremely high-cardinality labels (like raw path or user-agent) entirely, keeping the Prometheus metric dimensions bounded.",
    "good_code": "apiVersion: telemetry.istio.io/v1alpha1\nkind: Telemetry\nmetadata:\n  name: minimize-envoy-metrics\n  namespace: production-services\nspec:\n  metrics:\n    - providers:\n        - name: prometheus\n      overrides:\n        - match:\n            metric: REQUEST_COUNT\n          mode: CLIENT_AND_SERVER\n          # Customize dimensions to drop raw high-cardinality headers and format request paths\n          tagOverrides:\n            request_operation:\n              # Group dynamic URL patterns into unified operation buckets\n              value: \"request.url_path\"\n            request_path:\n              # Drop the raw path entirely to prevent high-cardinality timeseries bloat\n              operation: REMOVE\n            user_agent:\n              # Drop user-agent metric labels which differ on every browser request\n              operation: REMOVE",
    "verification": "Apply the Telemetry resource and port-forward the Envoy admin port: <code>kubectl port-forward <pod-name> 15000:15000</code>. Fetch the stats endpoint using <code>curl -s http://localhost:15000/stats/prometheus | grep istio_requests_total</code>. Verify that all dynamic URLs have their high-cardinality fields removed or replaced by static operation groups, and monitor container RSS memory consumption over 24 hours to confirm it has stabilized.",
    "date": "2026-05-31",
    "id": 1780224743,
    "type": "error"
});