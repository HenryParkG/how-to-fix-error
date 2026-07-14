window.onPostDataLoaded({
    "title": "Fixing Kubernetes CFS Throttling under High Concurrency",
    "slug": "fixing-kubernetes-cfs-throttling-high-concurrency",
    "language": "Kubernetes",
    "code": "CFS Throttling",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under high thread concurrency, application containers encounter severe Completely Fair Scheduler (CFS) bandwidth throttling, even when aggregate CPU usage is well below limits. This behavior is typically caused by the way CFS quota allocation divides CPU time into periods (e.g., 100ms). In highly multi-threaded processes, many threads request CPU slices concurrently, exhausting the container's quota early in the period and causing the application to lock up for the remainder of that period, resulting in high tail-latency spikes.</p>",
    "root_cause": "The Linux kernel's CFS scheduler allocates quotas on a per-period basis. A multi-threaded process running across a high number of cores can exhaust a container's fractional CPU limit in a fraction of the period, triggering aggressive throttling before the next period starts.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: concurrent-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: app\n        image: my-app:latest\n        resources:\n          limits:\n            cpu: \"4\"\n          requests:\n            cpu: \"2\"\n        env:\n        - name: GOMAXPROCS\n          value: \"64\" # Exhausts 4 cores limit instantly on large nodes",
    "solution_desc": "Configure the GOMAXPROCS/runtime worker threads to precisely match the CFS limits allocated to the container. Alternatively, enable Kubernetes CPU CFS quota bursts (Kubernetes v1.22+) to allow containers to borrow unused CPU quota from previous periods.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: concurrent-service\nspec:\n  template:\n    spec:\n      containers:\n      - name: app\n        image: my-app:latest\n        resources:\n          limits:\n            cpu: \"8\"\n          requests:\n            cpu: \"8\" # Aligned requests and limits minimize throttle spikes\n        env:\n        - name: GOMAXPROCS\n          value: \"8\" # Explicitly matches assigned CPU limits to restrict over-threading",
    "verification": "Exec into the container and check '/sys/fs/cgroup/cpu/cpu.stat' (or the equivalent cgroup v2 path) to monitor the 'nr_throttled' and 'throttled_time' metrics under a heavy load test. They should remain near zero.",
    "date": "2026-07-14",
    "id": 1784006515,
    "type": "error"
});