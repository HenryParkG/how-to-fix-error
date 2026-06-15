window.onPostDataLoaded({
    "title": "Fixing Go GC Latency Spikes Under CFS Quotas",
    "slug": "fixing-go-gc-latency-spikes-cfs-quotas",
    "language": "Go",
    "code": "Latency Spike",
    "tags": [
        "Go",
        "Backend",
        "Kubernetes",
        "Error Fix"
    ],
    "analysis": "<p>When deploying Go microservices to Kubernetes, workloads are typically constrained using Completely Fair Scheduler (CFS) CPU quotas. The Go Runtime runtime is heavily concurrent and spawns background operating system threads to handle Garbage Collection (GC) tasks. The Go GC Pacer calculates execution frequency and concurrency targets based on the host's physical CPU core count rather than the container's allocated CFS limits. Consequently, when a garbage collection cycle is triggered, the runtime launches too many concurrent worker threads. This sudden parallel burst saturates the container's allotted quotas almost instantly, prompting the Linux kernel to throttle (freeze) the container process. The resulting freeze produces severe tail-latency spikes (p99 > 500ms) and interferes with Go's cooperative scheduler preemption signals, which cannot execute while the entire container is paused.</p>",
    "root_cause": "The Go runtime (prior to GOMEMLIMIT integration and when running without CPU awareness) relies on the physical machine's core count. This mismatch results in excessive GC assistant threads executing concurrently, triggering rapid exhaustion of the CFS quota periods and resulting in kernel-level execution throttling.",
    "bad_code": "// main.go\npackage main\n\nimport (\n\t\"encoding/json\"\n\t\"net/http\"\n)\n\nfunc main() {\n\t// No limit coordination with Kubernetes CFS limits or memory bounds.\n\t// Under high CPU/memory load, GC pacing runs wildly out of bounds, triggering container throttle.\n\thttp.HandleFunc(\"/process\", func(w http.ResponseWriter, r *http.Request) {\n\t\tvar payload map[string]interface{}\n\t\tjson.NewDecoder(r.Body).Decode(&payload)\n\t\t// Memory allocations trigger GC continuously\n\t\tw.Write([]byte(\"success\"))\n\t})\n\thttp.ListenAndServe(\":8080\", nil)\n}",
    "solution_desc": "To resolve CFS quota throttling and GC latency spikes, we must enforce container resource awareness within the Go application runtime. This is achieved by: 1) Dynamically adjusting `GOMAXPROCS` to match the Kubernetes CPU limits using Uber's `automaxprocs` library. 2) Utilizing the `GOMEMLIMIT` environment variable (introduced in Go 1.19) to set a hard memory ceiling, preventing excessive GC cycles by pacing collections based on real container boundaries. 3) Ensuring Go 1.14+ is used so that asynchronous preemption signals can be delivered via OS signals, bypassing GC safe-point bottlenecks.",
    "good_code": "// main.go (Optimized)\npackage main\n\nimport (\n\t\"encoding/json\"\n\t\"net/http\"\n\t_ \"go.uber.org/automaxprocs\" // Automatically configures GOMAXPROCS to match cgroups limits\n\t\"runtime/debug\"\n)\n\nfunc init() {\n\t// Set a GC memory limit slightly below the Kubernetes limit (e.g., 90% of a 512MiB allocation)\n\t// This acts as a soft guide to the pacer to avoid unnecessary, frantic garbage collections\n\tdebug.SetMemoryLimit(460 * 1024 * 1024) \n}\n\nfunc main() {\n\thttp.HandleFunc(\"/process\", func(w http.ResponseWriter, r *http.Request) {\n\t\tvar payload map[string]interface{}\n\t\tjson.NewDecoder(r.Body).Decode(&payload)\n\t\tw.Write([]byte(\"success\"))\n\t})\n\thttp.ListenAndServe(\":8080\", nil)\n}",
    "verification": "Deploy the optimized Go binary to Kubernetes with a CPU limit of `500m` and memory limit of `512MiB`. Apply a high load of concurrent requests (e.g., using `hey` or `k6`). Query the container's system metric `container_cpu_cfs_throttled_seconds_total`. Verify that throttled seconds drop to zero and check p99 latencies to ensure they remain stable under 20ms.",
    "date": "2026-06-15",
    "id": 1781513453,
    "type": "error"
});