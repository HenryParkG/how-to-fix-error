window.onPostDataLoaded({
    "title": "Diagnosing Kubernetes Init Container CrashLoops",
    "slug": "diagnosing-kubernetes-init-container-crashloopbackoff",
    "language": "Kubernetes",
    "code": "CrashLoopBackOff",
    "tags": [
        "Kubernetes",
        "Docker",
        "DevOps",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When a Kubernetes Pod remains stuck in <code>Init:CrashLoopBackOff</code> or <code>Init:OOMKilled</code>, main application containers never initialize. Init containers execute sequentially to completion before app containers start. If an init container fails (e.g., migration script, configuration rendering, or dependency wait script), the Kubelet restarts it based on the Pod's <code>restartPolicy</code> with exponential backoff delays.</p><p>Standard commands like <code>kubectl logs &lt;pod-name&gt;</code> often return errors stating the container is waiting to start. Developers must target the specific init container name and inspect termination exit codes and OOM triggers via <code>kubectl describe pod</code>.</p>",
    "root_cause": "The init container script fails due to an unhandled exit code (such as a database connection timeout without retry) or exceeds its strict cgroup memory limit while running asset compilation/migrations, triggering the OOM killer.",
    "bad_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: web-app\nspec:\n  initContainers:\n  - name: wait-for-db\n    image: busybox:1.36\n    command: ['sh', '-c', 'nc -z -w 2 postgres-service 5432'] # Exits immediately if down\n    resources:\n      limits:\n        memory: \"16Mi\" # Easily OOMKilled under overhead\n        cpu: \"50m\"\n  containers:\n  - name: server\n    image: nginx:latest",
    "solution_desc": "Wrap network dependency checks in an explicit exponential backoff polling loop with a total timeout limit. Adjust CPU/memory requests and limits to accommodate execution peaks during migrations or initialization routines.",
    "good_code": "apiVersion: v1\nkind: Pod\nmetadata:\n  name: web-app\nspec:\n  initContainers:\n  - name: wait-for-db\n    image: busybox:1.36\n    command:\n    - sh\n    - -c\n    - |\n      until nc -z -w 2 postgres-service 5432; do\n        echo \"Waiting for postgres database to become ready...\";\n        sleep 2;\n      done;\n      echo \"Database is reachable!\";\n    resources:\n      requests:\n        memory: \"64Mi\"\n        cpu: \"100m\"\n      limits:\n        memory: \"128Mi\"\n        cpu: \"200m\"\n  containers:\n  - name: server\n    image: nginx:latest",
    "verification": "Run `kubectl describe pod web-app` to ensure `Init Containers` display `State: Terminated` with `Exit Code: 0`, followed by the main container entering `Running` status.",
    "date": "2026-08-24",
    "id": 1787532161,
    "type": "error"
});