window.onPostDataLoaded({
    "title": "Debugging gRPC 'GOAWAY' in High-Churn Meshes",
    "slug": "grpc-goaway-service-mesh-churn",
    "language": "Go",
    "code": "Unavailable: GOAWAY",
    "tags": [
        "Go",
        "Kubernetes",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>In service meshes like Istio or Linkerd, sidecar proxies manage connection pooling. When a pod is terminated during a rolling update, the proxy sends a 'GOAWAY' frame to the client. If the client does not handle this gracefully, it may attempt to send subsequent RPCs over a closing connection, resulting in a 'transport is closing' error. In high-churn environments, where pods are frequently scaled or moved, this leads to significant 5xx spikes despite the infrastructure being healthy.</p>",
    "root_cause": "Improper handling of HTTP/2 connection draining and lack of client-side retry logic for transient transport-level closures.",
    "bad_code": "conn, _ := grpc.Dial(target, grpc.WithInsecure())\nclient := pb.NewServiceClient(conn)\n// No retry policy; fails immediately on GOAWAY",
    "solution_desc": "Configure a gRPC Service Config with a retry policy targeting 'UNAVAILABLE' status codes and implement wait-for-ready logic. Additionally, tune the server-side MaxConnectionAge to prevent simultaneous mass-disconnects.",
    "good_code": "retryPolicy := `{\n    \"methodConfig\": [{\n        \"name\": [{\"service\": \"\"}],\n        \"retryPolicy\": {\n            \"maxAttempts\": 3,\n            \"initialBackoff\": \"0.1s\",\n            \"maxBackoff\": \"1s\",\n            \"backoffMultiplier\": 2,\n            \"retryableStatusCodes\": [\"UNAVAILABLE\"]\n        }\n    }]}\n`\nconn, _ := grpc.Dial(target, \n    grpc.WithDefaultServiceConfig(retryPolicy),\n    grpc.WithInsecure())",
    "verification": "Perform a rolling restart of the backend service while running a constant load test; verify zero failed requests in Prometheus metrics.",
    "date": "2026-04-17",
    "id": 1776390361,
    "type": "error"
});