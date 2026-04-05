window.onPostDataLoaded({
    "title": "Resolving Istio Sidecar OOMKill Loops",
    "slug": "istio-sidecar-oomkill-resolution",
    "language": "Go",
    "code": "Exit Code 137",
    "tags": [
        "Kubernetes",
        "Infra",
        "Go",
        "Error Fix"
    ],
    "analysis": "<p>High-throughput service meshes often encounter OOMKill loops in Envoy (istio-proxy) sidecars. This usually happens because the sidecar's memory footprint is not just a function of the traffic volume, but the number of endpoints, clusters, and secret updates it must track. In high-churn environments, the Envoy process accumulates 'XDS' metadata. When traffic spikes occur simultaneously with configuration updates, the heap usage exceeds the Kubernetes memory limit, triggering a SIGKILL and causing a cascading failure as other sidecars take over the load.</p>",
    "root_cause": "Insufficient memory resource limits for istio-proxy in environments with high endpoint churn or high-concurrency keep-alive connections.",
    "bad_code": "resources:\n  limits:\n    cpu: \"500m\"\n    memory: \"128Mi\" # Too low for high-throughput Envoy",
    "solution_desc": "Increase memory limits and optimize Envoy's concurrency settings. Use Istio's Discovery Selectors to limit the amount of configuration sent to each sidecar, and tune the 'concurrency' field to match the CPU limits to prevent unbounded buffer growth.",
    "good_code": "spec:\n  template:\n    metadata:\n      annotations:\n        sidecar.istio.io/proxyMemoryLimit: \"1Gi\"\n        sidecar.istio.io/proxyCPULimit: \"2\"\n        sidecar.istio.io/concurrency: \"2\"",
    "verification": "Monitor 'envoy_server_memory_allocated' via Prometheus. Ensure the value stays well below the Kubernetes limit under peak load.",
    "date": "2026-04-05",
    "id": 1775352513,
    "type": "error"
});