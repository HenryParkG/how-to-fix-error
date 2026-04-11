window.onPostDataLoaded({
    "title": "Fixing Istio Sidecar Termination in K8s Batch Jobs",
    "slug": "istio-sidecar-termination-race-condition",
    "language": "Kubernetes",
    "code": "JobCompletionTimeout",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>When running Kubernetes Jobs with an Istio sidecar injected, a common race condition occurs: the main application container finishes its task and exits, but the Envoy sidecar (istio-proxy) continues to run indefinitely.</p><p>Since Kubernetes Jobs only reach a 'Succeeded' state when all containers in the pod have exited, the Job remains in a 'Running' state, consuming resources and potentially causing CI/CD pipelines to hang or time out despite the actual work being completed.</p>",
    "root_cause": "The Envoy proxy sidecar does not automatically monitor the lifecycle of the primary application container and lacks a native mechanism to shut itself down upon the primary container's completion.",
    "bad_code": "apiVersion: batch/v1\nkind: Job\nmetadata:\n  name: data-processor\nspec:\n  template:\n    metadata:\n      annotations:\n        sidecar.istio.io/inject: \"true\"\n    spec:\n      containers:\n      - name: main-app\n        image: batch-worker:latest",
    "solution_desc": "For Istio 1.7+, use the 'holdApplicationUntilProxyReceivesContainerExit' feature or explicitly call the Envoy exit endpoint in a wrapper script. The most robust method for modern Istio versions is utilizing the 'proxy.istio.io/config' annotation to ensure the proxy terminates after the application.",
    "good_code": "apiVersion: batch/v1\nkind: Job\nmetadata:\n  name: data-processor\nspec:\n  template:\n    metadata:\n      annotations:\n        proxy.istio.io/config: '{ \"terminationDrainDuration\": \"5s\" }'\n        sidecar.istio.io/inject: \"true\"\n    spec:\n      containers:\n      - name: main-app\n        image: batch-worker:latest\n        command: [\"/bin/sh\", \"-c\"]\n        args:\n          - | \n            ./run-task.sh;\n            EXIT_CODE=$?;\n            curl -X POST http://localhost:15020/quitquitquit;\n            exit $EXIT_CODE",
    "verification": "Check Job status using 'kubectl get jobs'. The pod should transition to 'Completed' shortly after the main container finishes.",
    "date": "2026-04-11",
    "id": 1775890282,
    "type": "error"
});