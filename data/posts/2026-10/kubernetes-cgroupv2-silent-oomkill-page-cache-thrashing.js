window.onPostDataLoaded({
    "title": "Fix Kubernetes Cgroup v2 OOMKills from Page Cache Thrash",
    "slug": "kubernetes-cgroupv2-silent-oomkill-page-cache-thrashing",
    "language": "Kubernetes",
    "code": "OOMKilledExitCode137",
    "tags": [
        "Kubernetes",
        "Docker",
        "DevOps",
        "Error Fix"
    ],
    "analysis": "<p>In Linux cgroup v2 environments running modern Kubernetes distributions, total memory accounting (<code>memory.current</code>) is the sum of anonymous memory (heap/stack), swap, and filesystem page cache (both active and inactive file pages). Many stream processing, logging, or database containers run with low RSS memory usage but produce intense, unbuffered disk I/O.</p><p>When applications continuously write or read large local files (e.g., temporary rocksdb stores, batch CSV exports), dirty and inactive file page caches accumulate rapidly. If I/O throughput outpaces the kernel asynchronous reclamation rate (handled by <code>kswapd</code>), or if pages are marked dirty and cannot be evicted immediately, the container hits its <code>memory.max</code> limit. Cgroup v2 instantly invokes the OOM killer, killing the container process with exit code 137 despite the application reporting low process memory usage.</p>",
    "root_cause": "High-throughput unbuffered container disk I/O creates dirty page cache allocations faster than kernel memory eviction can reclaim them, exceeding the cgroup v2 memory.max boundary.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n      - name: batch-processor\n        image: batch-processor:v1\n        # Unbuffered heavy disk I/O with strict memory limit\n        resources:\n          limits:\n            memory: \"512Mi\"\n          requests:\n            memory: \"256Mi\"\n        volumeMounts:\n        - name: scratch-space\n          mountPath: /data\n      volumes:\n      - name: scratch-space\n        emptyDir: {} # Default storage writes to node root disk, thrashing page cache",
    "solution_desc": "Mitigate page cache exhaustion by mounting an in-memory `emptyDir: { medium: Memory }` with a strict sizeLimit, or by updating application code to use direct I/O (`O_DIRECT`) or advise the kernel via `posix_fadvise(POSIX_FADV_DONTNEED)`. In the Pod spec, configure `memory.high` thresholds or add sufficient limit headroom above working RSS.",
    "good_code": "apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n      - name: batch-processor\n        image: batch-processor:v2\n        resources:\n          limits:\n            memory: \"2Gi\"\n          requests:\n            memory: \"1Gi\"\n        volumeMounts:\n        - name: scratch-space\n          mountPath: /data\n      volumes:\n      - name: scratch-space\n        emptyDir:\n          medium: Memory\n          sizeLimit: \"768Mi\"",
    "verification": "Inspect `/sys/fs/cgroup/memory.stat` inside the container or node to evaluate `inactive_file` vs `anon`. Verify `kubectl get pod -o yaml` shows zero container terminations with reason `OOMKilled` during peak I/O pipelines.",
    "date": "2026-10-09",
    "id": 1791548548,
    "type": "error"
});