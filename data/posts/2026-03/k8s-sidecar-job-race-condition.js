window.onPostDataLoaded({
    "title": "Fix K8s Sidecar Lifecycle Race in Jobs",
    "slug": "k8s-sidecar-job-race-condition",
    "language": "Go, YAML",
    "code": "SIGTERM_RACE",
    "tags": [
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Kubernetes Jobs often utilize sidecars for logging, proxying, or secret management. However, a known issue exists where the main container finishes its task, but the sidecar continues to run indefinitely. Because a Pod only completes when all containers exit, the Job never reaches the 'Succeeded' state, leading to resource leaks and workflow staleness.</p>",
    "root_cause": "The Kubelet does not automatically send a SIGTERM to sidecars when the primary container (the one defined in the Job) exits successfully.",
    "bad_code": "apiVersion: batch/v1\nkind: Job\nspec:\n  template:\n    spec:\n      containers:\n      - name: main-worker\n        image: worker:latest\n      - name: sidecar-proxy\n        image: proxy:latest",
    "solution_desc": "Upgrade to Kubernetes 1.29+ and use the 'SidecarContainers' feature by setting 'restartPolicy: Always' on the sidecar. Alternatively, use a shared volume 'sentinel' file that the sidecar watches to trigger its own exit.",
    "good_code": "containers:\n- name: sidecar-proxy\n  image: proxy:latest\n  restartPolicy: Always # K8s 1.29+ Native Sidecar\n- name: main-worker\n  command: [\"/bin/sh\", \"-c\"]\n  args: [\"./do_work && touch /shared/done\"]",
    "verification": "Check 'kubectl get pods' to ensure the Pod transitions to 'Completed' status immediately after the main container exits.",
    "date": "2026-03-23",
    "id": 1774241870,
    "type": "error"
});