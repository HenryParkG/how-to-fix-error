window.onPostDataLoaded({
    "title": "Fix K8s cgroup v2 OOMKills from Page Cache Thrashing",
    "slug": "fix-kubernetes-cgroupv2-oomkills-page-cache-thrashing",
    "language": "Go / Kubernetes",
    "code": "OOMKilled (Exit 137)",
    "tags": [
        "Kubernetes",
        "Docker",
        "Go",
        "Infra",
        "Error Fix"
    ],
    "analysis": "<p>Under cgroup v2, Kubernetes pod memory accounting strictness changed significantly compared to cgroup v1. In cgroup v2, kernel page cache (file memory) is accounted directly against the container's overall memory ceiling. Containers performing intense disk I/O\u2014such as log aggregation, database indexing, or streaming large binaries\u2014cause the kernel page cache to expand rapidly. If page reclamation cannot keep pace with allocation rate spikes, the kernel OOM killer terminates the process (Exit Code 137) despite low application RSS heap usage.</p>",
    "root_cause": "cgroup v2 enforces container limits on total memory usage (`anon` + `file` + `kernel`). When disk I/O throughput spikes, unthrottled page cache allocations fill the available headroom before kernel background reclaim (`kswapd`) can safely evict clean file pages.",
    "bad_code": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: file-processor\nspec:\n  template:\n    spec:\n      containers:\n      - name: worker\n        image: worker:v1.0\n        # Missing memory limits tune-up, easily killed by cgroup v2 page cache spikes\n        resources:\n          limits:\n            memory: \"2Gi\"\n          requests:\n            memory: \"1Gi\"",
    "solution_desc": "Mitigate cache thrashing by dropping unneeded pages inside application code via POSIX file advice calls (`posix_fadvise` / `POSIX_FADV_DONTNEED`), adjusting node-level `vm.dirty_background_ratio`, and configuring cgroup v2 memory protections (`memory.high` / `memory.min`) to force early background eviction.",
    "good_code": "package main\n\nimport (\n\t\"os\"\n\t\"golang.org/x/sys/unix\"\n)\n\n// ProcessFile reads data and instructs kernel to release cached pages immediately\nfunc ProcessFile(path string) error {\n\tf, err := os.Open(path)\n\tif err != nil {\n\t\treturn err\n\t}\n\tdefer f.Close()\n\n\tfi, err := f.Stat()\n\tif err != nil {\n\t\treturn err\n\t}\n\n\t// Stream processing logic here...\n\t// ...\n\n\t// Evict file pages from kernel page cache to prevent memory bloat\n\t_ = unix.Fadvise(int(f.Fd()), 0, fi.Size(), unix.FADV_DONTNEED)\n\treturn nil\n}",
    "verification": "Monitor container memory breakdown using `container_memory_working_set_bytes` and `container_memory_rss` in Prometheus. Verify that page cache (`container_memory_cache`) remains stable and no OOMKilled events are recorded under peak I/O loads.",
    "date": "2026-07-28",
    "id": 1785217083,
    "type": "error"
});