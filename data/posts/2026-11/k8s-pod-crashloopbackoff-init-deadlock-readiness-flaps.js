window.onPostDataLoaded({
    "title": "Fix K8s Init Container Deadlock & Probe Flaps",
    "slug": "k8s-pod-crashloopbackoff-init-deadlock-readiness-flaps",
    "language": "Kubernetes",
    "code": "CrashLoopBackOff",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>A pod entering <code>CrashLoopBackOff</code> is often triggered by misconfigured dependency chains during initialization or aggressive probing during container boot. When an init container runs a blocking connectivity check (such as polling an external migration service or service mesh sidecar) without finite timeouts or backoff controls, it deadlocks if the dependency is circular or down.</p><p>Furthermore, configuring high-frequency readiness probes with insufficient <code>initialDelaySeconds</code> and a <code>failureThreshold</code> of 1 causes transient cold-start latency (JVM warmup, Node.js module loading) to fail checks. Kubelet immediately removes the Pod from Service endpoints and kills/restarts the container, inducing continuous restart loops.</p>",
    "root_cause": "Blocking init container loops without bounded retry timeouts combined with missing startup probes, causing premature readiness probe failures during cold-start.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: payment-service\nspec:\n  initContainers:\n  - name: wait-db\n    image: busybox:1.36\n    command: ['sh', '-c', 'until nc -z db-service 5432; do sleep 1; done'] # Infinite loop, deadlocks pod if db is unready\n  containers:\n  - name: app\n    image: payment-service:v2.1.0\n    ports:\n    - containerPort: 8080\n    readinessProbe: # Overly strict: fails during framework boot\n      httpGet:\n        path: /healthz\n        port: 8080\n      initialDelaySeconds: 1\n      periodSeconds: 2\n      failureThreshold: 1\n      timeoutSeconds: 1",
    "solution_desc": "Introduce bounded execution timeouts and exponential backoff in init containers. Decouple initialization checks from steady-state traffic checks using a dedicated 'startupProbe', which gives the application adequate time to warm up before 'readinessProbe' starts monitoring.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: payment-service\nspec:\n  initContainers:\n  - name: wait-db\n    image: busybox:1.36\n    # Enforce finite attempt limits and bounded timeouts\n    command:\n    - sh\n    - -c\n    - |\n      RETRIES=30\n      until nc -z -w 2 db-service 5432 || [ $RETRIES -eq 0 ]; do\n        echo \"Waiting for DB... remaining attempts: $RETRIES\"\n        RETRIES=$((RETRIES-1))\n        sleep 2\n      done\n      if [ $RETRIES -eq 0 ]; then echo \"DB connection timeout\"; exit 1; fi\n  containers:\n  - name: app\n    image: payment-service:v2.1.0\n    ports:\n    - containerPort: 8080\n    # Startup probe handles cold-start without killing container\n    startupProbe:\n      httpGet:\n        path: /healthz\n        port: 8080\n      failureThreshold: 30\n      periodSeconds: 2\n    # Readiness probe takes over only after startup probe passes\n    readinessProbe:\n      httpGet:\n        path: /healthz\n        port: 8080\n      initialDelaySeconds: 5\n      periodSeconds: 5\n      failureThreshold: 3\n      timeoutSeconds: 2",
    "verification": "Execute 'kubectl describe pod payment-service' to verify init container completes with Exit Code: 0. Inspect 'Events:' to confirm no 'Readiness probe failed' events occur before container marks Ready.",
    "date": "2026-11-02",
    "id": 1793629220,
    "type": "error"
});