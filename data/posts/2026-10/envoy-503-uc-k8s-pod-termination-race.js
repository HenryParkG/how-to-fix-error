window.onPostDataLoaded({
    "title": "Envoy 503 UC Drops via K8s Pod Termination Races",
    "slug": "envoy-503-uc-k8s-pod-termination-race",
    "language": "Envoy Proxy",
    "code": "503 UC",
    "tags": [
        "Kubernetes",
        "Docker",
        "Envoy",
        "Error Fix"
    ],
    "analysis": "<p>During Kubernetes rolling deployments or horizontal pod autoscaling scaledowns, pods receive a termination signal. A fundamental race condition exists between Kubernetes control plane event distribution and container execution: the EndpointSlice / kube-proxy / Envoy Endpoint Discovery Service (EDS) propagation occurs asynchronously from the <code>SIGTERM</code> dispatch to the target container.</p><p>If the target pod shuts down its HTTP listener or drops its network interface before Envoy receives and applies the updated endpoint list via EDS, Envoy forwards pending HTTP requests to an IP that is actively refusing connections. Envoy immediately aborts the transaction and returns an HTTP <code>503</code> response with the response flag <code>UC</code> (Upstream Connection failure).</p>",
    "root_cause": "The target pod process terminates immediately upon SIGTERM before Envoy EDS propagates the endpoint removal, causing traffic to be routed to a dead container socket.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  replicas: 3\n  template:\n    metadata:\n      labels:\n        app: payment-service\n    spec:\n      containers:\n      - name: payment-service\n        image: payment-service:v1.2.0\n        ports:\n        - containerPort: 8080\n        # Defect: Container receives SIGTERM and exits immediately,\n        # racing against Envoy EDS endpoint convergence.",
    "solution_desc": "Introduce an intentional delay in the upstream pod termination sequence using a `preStop` lifecycle hook. This ensures the pod continues serving incoming connections while Kubernetes propagates the deletion event to Envoy EDS. Additionally, configure Envoy's cluster definition with `drain_connections_on_host_removal: true` and active health-checking to purge dying endpoints gracefully.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\nspec:\n  replicas: 3\n  template:\n    metadata:\n      labels:\n        app: payment-service\n    spec:\n      containers:\n      - name: payment-service\n        image: payment-service:v1.2.0\n        lifecycle:\n          preStop:\n            exec:\n              # Delay allows EDS to remove the pod from Envoy active clusters\n              # before the application stops accepting connections\n              command: [\"/bin/sh\", \"-c\", \"sleep 15\"]\n        ports:\n        - containerPort: 8080\n      terminationGracePeriodSeconds: 45",
    "verification": "Run a continuous load test using `k6` or `fortio` targeting the Envoy ingress gateway while executing `kubectl rollout restart deployment payment-service`. Verify Envoy access logs contain zero `503 UC` responses.",
    "date": "2026-10-11",
    "id": 1791687484,
    "type": "error"
});