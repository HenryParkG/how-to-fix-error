window.onPostDataLoaded({
    "title": "Resolving Istio Egress Gateway Bottlenecks",
    "slug": "istio-egress-gateway-bottlenecks-fix",
    "language": "Go",
    "code": "Envoy Downstream Reset",
    "tags": [
        "Kubernetes",
        "Infra",
        "Docker",
        "Error Fix"
    ],
    "analysis": "<p>In multi-cluster Istio meshes, Egress Gateways act as the centralized exit point for traffic leaving the mesh. Bottlenecks occur when the gateway's Envoy proxy becomes saturated due to high connection counts, complex SNI routing, or mTLS handshake overhead.</p><p>Standard configurations often lack the necessary connection pooling and resource limits to handle sudden spikes in outbound traffic, leading to 503 Service Unavailable errors or 'upstream connect error or disconnect/reset before headers' messages in the logs.</p>",
    "root_cause": "Resource exhaustion on Egress Gateway pods and default Envoy settings that limit concurrent streams and connection reuse for outbound traffic.",
    "bad_code": "apiVersion: networking.istio.io/v1alpha3\nkind: Gateway\nmetadata:\n  name: egress-gateway\nspec:\n  # Standard config without resource limits or HPA\n  selector:\n    istio: egressgateway",
    "solution_desc": "Implement Horizontal Pod Autoscaling (HPA) for the Egress Gateway and optimize the DestinationRule to include connection pool settings. Use 'STRICT' mTLS and ensure that the Egress Gateway has sufficient CPU and memory resources to handle TLS termination at scale.",
    "good_code": "apiVersion: networking.istio.io/v1alpha3\nkind: DestinationRule\nmetadata:\n  name: egress-optimization\nspec:\n  host: egress-gateway.istio-system.svc.cluster.local\n  trafficPolicy:\n    connectionPool:\n      tcp:\n        maxConnections: 1024\n      http:\n        http2MaxRequests: 1024\n        maxRequestsPerConnection: 10",
    "verification": "Monitor 'istio_requests_total' metrics with the 'response_code=\"503\"' filter and use 'istioctl proxy-config' to verify that connection limits are correctly applied to the gateway.",
    "date": "2026-05-18",
    "id": 1779106900,
    "type": "error"
});