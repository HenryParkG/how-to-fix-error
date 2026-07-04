window.onPostDataLoaded({
    "title": "Resolving K8s OOMKilled Spikes from Go Runtime Lag",
    "slug": "k8s-oomkilled-go-runtime-memory-lag",
    "language": "Go",
    "code": "OOMKilled",
    "tags": [
        "Go",
        "Kubernetes",
        "Docker",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Go applications deployed inside Kubernetes clusters often experience sudden <code>OOMKilled (Exit Code 137)</code> events, even when memory profiles show that heap usage is well within the limits. This is caused by a latency lag in the Go runtime's memory scavenger, which fails to release physical memory pages back to the operating system quickly enough during sudden allocation spikes. While Go's garbage collector (GC) runs and marks heap space as free internally, the physical memory remains resident (RSS) until the scavenger asynchronously runs, leading the container runtime's cgroup boundaries to trigger an immediate termination.</p>",
    "root_cause": "Prior to explicit runtime limits, Go was unaware of containerized cgroup memory limits. When memory allocation spikes occur, the heap expands rapidly. Although GC frees the memory internally, the Go scavenger lags in returning virtual address space pages to the OS kernel via `MADV_DONTNEED`/`MADV_FREE`. The OS kernel enforces limits strictly, killing the container when RSS surpasses limits.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: go-api-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: api\n        image: go-api:latest\n        resources:\n          limits:\n            memory: \"1Gi\" # No matching runtime variable in Go\n          requests:\n            memory: \"512Mi\"",
    "solution_desc": "Architecturally align the Go runtime's memory threshold with the Kubernetes memory limits. Introduce the `GOMEMLIMIT` environment variable (introduced in Go 1.19), configuring it to roughly 90% of the container's hard memory limit. This tells the Go runtime GC to trigger aggressively as memory usage nears the container ceiling, avoiding OOM kills while dynamically reclaiming memory.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: go-api-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: api\n        image: go-api:latest\n        env:\n        - name: GOMEMLIMIT\n          value: \"900MiB\" # Set to ~90% of the 1GiB cgroup limit\n        - name: GOGC\n          value: \"100\" # Keep GC target percentage balanced\n        resources:\n          limits:\n            memory: \"1Gi\"\n          requests:\n            memory: \"512Mi\"",
    "verification": "Deploy the updated service to your Kubernetes cluster and put it under a heavy load test. Monitor metrics using PromQL: `container_memory_working_set_bytes` should plateau gracefully around 900MiB instead of spiking straight to 1GiB and crashing with Exit Code 137.",
    "date": "2026-07-04",
    "id": 1783145486,
    "type": "error"
});