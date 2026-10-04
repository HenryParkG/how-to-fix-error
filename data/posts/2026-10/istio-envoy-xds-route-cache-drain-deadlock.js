window.onPostDataLoaded({
    "title": "Istio Envoy Route Cache Bloat & Drain Deadlocks",
    "slug": "istio-envoy-xds-route-cache-drain-deadlock",
    "language": "Envoy",
    "code": "XDS_CONFIG_STALL",
    "tags": [
        "Istio",
        "Envoy",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>In Kubernetes clusters experiencing high deployment churn, frequent autoscaling, or rapid VirtualService updates, Istio's dynamic discovery service (xDS) continuously pushes route and cluster configurations to Envoy sidecars. Each dynamic update generates a new internal configuration version (RouteConfiguration and Cluster resources).</p><p>When HTTP keep-alive connections or long-lived gRPC streams remain established on existing listeners, Envoy enters a connection draining phase for the superseded clusters and route tables. However, if the downstream clients do not terminate connections and the drain configuration does not forcefully close them, Envoy retains the historical route caches in memory. Over continuous canary deployments, this retention causes unbound memory consumption (Route Cache Bloat) and thread lock contention across worker threads attempting to evaluate retired configuration trees.</p>",
    "root_cause": "Long-lived keep-alive streams retain references to stale Envoy route table and cluster instances during dynamic xDS pushes, preventing garbage collection of obsolete configurations due to indefinite connection drain timeouts.",
    "bad_code": "apiVersion: networking.istio.io/v1beta1\nkind: VirtualService\nmetadata:\n  name: payment-service-vs\n  namespace: default\nspec:\n  hosts:\n  - \"payment.internal\"\n  http:\n  - route:\n    - destination:\n        host: payment-service\n        subset: v1\n# Missing connection pool timeouts, missing keepalive limits,\n# and relying on default indefinite drain times during deployment churn.",
    "solution_desc": "Limit configuration scope using Istio `Sidecar` resources so sidecars only receive necessary xDS updates. Additionally, configure `EnvoyFilter` or `DestinationRule` to enforce aggressive connection drain timeouts, idle stream terminations, and enable Delta xDS in Istio Pilot to stream state changes incrementally instead of rebroadcasting full configuration trees.",
    "good_code": "apiVersion: networking.istio.io/v1beta1\nkind: Sidecar\nmetadata:\n  name: default-sidecar-scope\n  namespace: default\nspec:\n  egress:\n  - hosts:\n    - \"./*\"\n    - \"istio-system/*\"\n---\napiVersion: networking.istio.io/v1alpha3\nkind: EnvoyFilter\nmetadata:\n  name: drain-and-idle-timeout\n  namespace: default\nspec:\n  configPatches:\n  - applyTo: NETWORK_FILTER\n    match:\n      listener:\n        filterChain:\n          filter:\n            name: \"envoy.filters.network.http_connection_manager\"\n    patch:\n      operation: MERGE\n      value:\n        typed_config:\n          \"@type\": \"type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\"\n          common_http_protocol_options:\n            idle_timeout: 30s\n            max_connection_duration: 300s\n          delayed_close_timeout: 5s\n          drain_timeout: 15s",
    "verification": "Query Envoy statistics via the admin interface: `curl http://127.0.0.1:15000/stats | grep -E '(server.live_memory|cluster_manager.active_clusters)'`. Verify memory stabilizing and obsolete clusters cleaning up within 15 seconds during continuous deployment rollouts.",
    "date": "2026-10-04",
    "id": 1791084418,
    "type": "error"
});