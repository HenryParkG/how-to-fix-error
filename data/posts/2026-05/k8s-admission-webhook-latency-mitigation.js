window.onPostDataLoaded({
    "title": "Mitigating K8s Admission Webhook Latency Spikes",
    "slug": "k8s-admission-webhook-latency-mitigation",
    "language": "Go",
    "code": "K8sLatency",
    "tags": [
        "Kubernetes",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kubernetes admission webhooks are critical for policy enforcement, but they can become a massive bottleneck in mass-scaling clusters. When the API server sends a request to a webhook (e.g., for a ValidatingWebhookConfiguration), it waits synchronously. If the webhook service is slow or under-provisioned, every 'kubectl apply' or HPA scale-up event hangs.</p><p>Latency spikes often occur during 'thundering herd' scenarios where hundreds of pods are created simultaneously, overwhelming the webhook's pod-autoscaler or exceeding the default 10-second timeout, leading to request rejection.</p>",
    "root_cause": "Synchronous blocking calls from the API server to webhooks without optimized object filtering or sufficient webhook horizontal scaling.",
    "bad_code": "apiVersion: admissionregistration.k8s.io/v1\nkind: ValidatingWebhookConfiguration\nwebhooks:\n  - name: my-webhook.example.com\n    rules:\n      - operations: [\"CREATE\"]\n        apiGroups: [\"*\"]\n        apiVersions: [\"*\"]\n        resources: [\"*\"] # Intercepts everything, increasing load",
    "solution_desc": "Implement 'matchExpressions' and 'namespaceSelector' to limit which objects trigger the webhook. Set a strict 'timeoutSeconds' and use 'failurePolicy: Ignore' for non-critical hooks. Scale the webhook deployment using a dedicated PriorityClass.",
    "good_code": "apiVersion: admissionregistration.k8s.io/v1\nkind: ValidatingWebhookConfiguration\nwebhooks:\n  - name: my-webhook.example.com\n    timeoutSeconds: 2\n    failurePolicy: Ignore\n    namespaceSelector:\n      matchExpressions:\n        - key: kubernetes.io/metadata.name\n          operator: NotIn\n          values: [\"kube-system\"]\n    rules:\n      - operations: [\"CREATE\"]\n        apiGroups: [\"apps\"]\n        resources: [\"deployments\"]",
    "verification": "Monitor the 'apiserver_admission_webhook_admission_duration_seconds' metric in Prometheus. Ensure p99 latency stays below 200ms.",
    "date": "2026-05-06",
    "id": 1778046567,
    "type": "error"
});